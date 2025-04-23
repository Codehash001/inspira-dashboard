import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const walletId = searchParams.get('walletId')
    const adminWallet = process.env.NEXT_PUBLIC_ADMIN_WALLET
    const page = Number(searchParams.get('page')) || 1
    const pageSize = 10
    const skip = (page - 1) * pageSize
    const search = searchParams.get('search') || ''

    if (!walletId || walletId.toLowerCase() !== adminWallet?.toLowerCase()) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 })
    }

    // Build where clause for search using Prisma types
    const where: Prisma.UserWhereInput = search ? {
      OR: [
        {
          username: {
            contains: search,
            mode: 'insensitive' as Prisma.QueryMode
          }
        },
        {
          walletId: {
            contains: search,
            mode: 'insensitive' as Prisma.QueryMode
          }
        }
      ]
    } : {}

    // Get total count for pagination
    const totalCount = await prisma.user.count({ where })

    const currentDate = new Date()

    // Get users with all related data
    const users = await prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        creditBalances: {
          where: {
            expiredDate: {
              gt: currentDate // Only get non-expired credits
            }
          }
        },
        transactions: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
        }
      }
    })

    // Format users for response
    const formattedUsers = users.map(user => {
      // Calculate total available credits from all non-expired credit balances
      const totalCredits = user.creditBalances.reduce((sum, balance) => {
        return sum + (balance.remainingBalance || 0)
      }, 0)

      // Get the latest credit balance for plan info
      const latestCreditBalance = user.creditBalances
        .sort((a, b) => b.purchasedDate.getTime() - a.purchasedDate.getTime())[0]

      // Get last active time from latest transaction
      const lastActive = user.transactions[0]?.createdAt || user.createdAt

      return {
        walletId: user.walletId,
        username: user.username || 'Anonymous',
        plan: user.plan || 'Free',
        credits: totalCredits,
        createdAt: user.createdAt,
        lastActive: lastActive,
        creditExpiry: latestCreditBalance?.expiredDate || null
      }
    })

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        total: totalCount,
        pageSize,
        currentPage: page,
        totalPages: Math.ceil(totalCount / pageSize)
      }
    })
  } catch (error) {
    console.error('Error in users API:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
