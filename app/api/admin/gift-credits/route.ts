import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { walletId, credits } = await req.json()
    
    console.log('Received request:', { walletId, credits })

    // Validate input
    if (!walletId || !credits || credits <= 0) {
      console.log('Invalid input parameters:', { walletId, credits })
      return NextResponse.json(
        { error: 'Invalid input parameters' },
        { status: 400 }
      )
    }

    // Normalize the wallet address to lowercase
    const normalizedWalletId = walletId.toLowerCase()
    console.log('Looking for user with wallet:', normalizedWalletId)

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { walletId: normalizedWalletId },
    })

    console.log('Found user:', user)

    if (!user) {
      // If user doesn't exist, create them
      console.log('User not found, creating new user')
      user = await prisma.user.create({
        data: {
          walletId: normalizedWalletId,
          plan: 'free'
        }
      })
      console.log('Created new user:', user)
    }

    // Create a transaction record
    const transaction = await prisma.transaction.create({
      data: {
        walletId: normalizedWalletId,
        transactionType: 'gift_credits',
        status: 'completed',
        paymentMethod: 'GIFT',
        paymentAmount: 0,
        creditsAdded: credits,
        transactionFee: 0,
        transactionNote: 'Credits gifted by admin'
      },
    })

    console.log('Created transaction:', transaction)

    // Create credit balance record
    const creditBalance = await prisma.creditBalance.create({
      data: {
        walletId: normalizedWalletId,
        plan: user.plan || 'free',
        allowedCredits: credits,
        expiredDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        creditUsed: 0,
        remainingBalance: credits,
        transactionId: transaction.id,
      },
    })

    console.log('Created credit balance:', creditBalance)

    return NextResponse.json({ 
      success: true, 
      transaction,
      creditBalance
    })
  } catch (error: any) {
    console.error('Error gifting credits:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to gift credits' },
      { status: 500 }
    )
  }
}
