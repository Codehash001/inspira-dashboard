import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const walletId = searchParams.get('walletId')
    const adminWallet = process.env.NEXT_PUBLIC_ADMIN_WALLET
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    if (!walletId || walletId.toLowerCase() !== adminWallet?.toLowerCase()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const where: Prisma.TransactionWhereInput = search ? {
      OR: [
        {
          user: {
            username: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          user: {
            walletId: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          transactionType: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ]
    } : {}

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          user: {
            select: {
              username: true,
              walletId: true,
              plan: true
            }
          }
        }
      }),
      prisma.transaction.count({ where })
    ])

    console.log('transactions: ', transactions)

    return NextResponse.json({
      transactions: transactions.map(tx => ({
        id: tx.id,
        username: tx.user.username,
        walletId: tx.user.walletId,
        plan: tx.user.plan,
        type: tx.transactionType,
        amount: tx.paymentAmount,
        paymentMethod: tx.paymentMethod,
        credits: tx.creditsAdded,
        fee: tx.transactionFee,
        status: tx.status,
        date: tx.createdAt
      })),
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit
      }
    })
  } catch (error) {
    console.error('Error in admin transactions:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}
