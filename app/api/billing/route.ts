import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const walletId = searchParams.get('walletId')
  const type = searchParams.get('type')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const skip = (page - 1) * limit

  if (!walletId) {
    return NextResponse.json({ error: 'Wallet ID is required' }, { status: 400 })
  }

  try {
    const where = {
      walletId,
      ...(type ? { transactionType: type } : {})
    }

    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              username: true
            }
          }
        }
      }),
      prisma.transaction.count({ where })
    ])

    return NextResponse.json({
      data: transactions,
      totalCount,
      page,
      limit
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}
