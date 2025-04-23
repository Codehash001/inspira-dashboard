import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

const planTypes = ['free', 'pro', 'ultra']

export async function POST(req: Request) {
  try {
    const { walletId, planType } = await req.json()
    
    console.log('Updating user plan:', { walletId, planType })

    // Validate input
    if (!walletId || !Number.isInteger(planType) || planType < 0 || planType > 2) {
      return NextResponse.json(
        { error: 'Invalid input parameters' },
        { status: 400 }
      )
    }

    const normalizedWalletId = walletId.toLowerCase()
    const planName = planTypes[planType]

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { walletId: normalizedWalletId },
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          walletId: normalizedWalletId,
          plan: planName,
        },
      })
    } else {
      user = await prisma.user.update({
        where: { walletId: normalizedWalletId },
        data: { plan: planName },
      })
    }

    // Create a transaction record for the plan change
    const transaction = await prisma.transaction.create({
      data: {
        walletId: normalizedWalletId,
        transactionType: 'plan_change',
        status: 'completed',
        paymentMethod: 'ADMIN',
        paymentAmount: 0,
        creditsAdded: 0,
        transactionFee: 0,
        transactionNote: `Plan changed to ${planName} by admin`
      },
    })

    console.log('Updated user plan:', user)
    console.log('Created transaction:', transaction)

    return NextResponse.json({ 
      success: true, 
      user,
      transaction
    })
  } catch (error: any) {
    console.error('Error updating user plan:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update user plan' },
      { status: 500 }
    )
  }
}
