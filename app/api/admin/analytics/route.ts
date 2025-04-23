import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getDateRange } from '@/lib/date-range'

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Process monthly data for charts
function processMonthlyData(revenue: any[]): any[] {
  const monthlyData = new Map()
  
  // Initialize with all months
  const months = []
  for (let i = 5; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const monthKey = date.toLocaleString('default', { month: 'short' })
    months.push(monthKey)
    monthlyData.set(monthKey, { name: monthKey, USDT: 0, INSPI: 0 })
  }

  // Process revenue data
  revenue.forEach((item: any) => {
    const month = new Date(item.createdAt).toLocaleString('default', { month: 'short' })
    if (monthlyData.has(month)) {
      const data = monthlyData.get(month)
      if (item.paymentMethod === 'USDT') {
        data.USDT += item._sum.paymentAmount || 0
      } else if (item.paymentMethod === 'INSPI') {
        data.INSPI += item._sum.paymentAmount || 0
      }
    }
  })

  return Array.from(monthlyData.values())
}

export async function GET(request: Request) {
  try {
    const { startDate, endDate } = getDateRange('month')
    const prevStartDate = new Date(startDate)
    prevStartDate.setMonth(prevStartDate.getMonth() - 1)
    const prevEndDate = new Date(endDate)
    prevEndDate.setMonth(prevEndDate.getMonth() - 1)

    // Get user statistics
    const userStats = await prisma.user.groupBy({
      by: ['plan'],
      _count: {
        walletId: true
      }
    })

    // Get recent transactions
    const url = request.url || ''
    const searchParams = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '')
    const page = Number(searchParams.get('page')) || 1
    const pageSize = 10
    const skip = (page - 1) * pageSize

    // Get total count for pagination
    const totalCount = await prisma.transaction.count()

    // Get transactions with pagination
    const transactions = await prisma.transaction.findMany({
      skip,
      take: pageSize,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            walletId: true,
            username: true
          }
        }
      }
    })

    // Format transactions for response
    const formattedTransactions = transactions.map(tx => ({
      id: tx.id,
      walletId: tx.walletId,
      username: tx.user?.username,
      transactionType: tx.transactionType,
      createdAt: tx.createdAt,
      transactionHash: tx.transactionHash,
      status: tx.status,
      paymentMethod: tx.paymentMethod,
      paymentAmount: Number(tx.paymentAmount),
      creditsAdded: Number(tx.creditsAdded)
    }))

    // Get revenue statistics by payment method
    const [currentUSDT, currentINSPI, previousUSDT, previousINSPI] = await Promise.all([
      // Current month USDT
      prisma.transaction.aggregate({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: 'completed',
          paymentMethod: 'USDT'
        },
        _sum: { paymentAmount: true }
      }),
      // Current month INSPI
      prisma.transaction.aggregate({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: 'completed',
          paymentMethod: 'INSPI'
        },
        _sum: { paymentAmount: true }
      }),
      // Previous month USDT
      prisma.transaction.aggregate({
        where: {
          createdAt: { gte: prevStartDate, lte: prevEndDate },
          status: 'completed',
          paymentMethod: 'USDT'
        },
        _sum: { paymentAmount: true }
      }),
      // Previous month INSPI
      prisma.transaction.aggregate({
        where: {
          createdAt: { gte: prevStartDate, lte: prevEndDate },
          status: 'completed',
          paymentMethod: 'INSPI'
        },
        _sum: { paymentAmount: true }
      })
    ])

    // Get credits usage statistics
    const creditsStats = await prisma.creditBalance.aggregate({
      where: {
        purchasedDate: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: {
        creditUsed: true,
        allowedCredits: true
      }
    })

    // Get all-time service usage statistics
    const serviceUsage = await Promise.all([
      prisma.chatHistory.count(),
      prisma.imageGenerationHistory.count(),
      prisma.videoGenerationHistory.count(),
      prisma.bookGradingHistory.count(),
      prisma.smartContractAudit.count()
    ])

    // Get current month service usage
    const currentMonthUsage = await Promise.all([
      prisma.chatHistory.count({
        where: { createdAt: { gte: startDate, lte: endDate } }
      }),
      prisma.imageGenerationHistory.count({
        where: { createdAt: { gte: startDate, lte: endDate } }
      }),
      prisma.videoGenerationHistory.count({
        where: { createdAt: { gte: startDate, lte: endDate } }
      }),
      prisma.bookGradingHistory.count({
        where: { createdAt: { gte: startDate, lte: endDate } }
      }),
      prisma.smartContractAudit.count({
        where: { createdAt: { gte: startDate, lte: endDate } }
      })
    ])

    // Get monthly data for charts
    const monthlyData = await Promise.all([
      // Monthly revenue
      prisma.transaction.groupBy({
        by: ['createdAt', 'paymentMethod'],
        where: {
          status: 'completed',
          createdAt: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
          }
        },
        _sum: {
          paymentAmount: true
        }
      }),
      // Monthly credits usage
      prisma.creditBalance.groupBy({
        by: ['purchasedDate'],
        where: {
          purchasedDate: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
          }
        },
        _sum: {
          creditUsed: true
        }
      })
    ])

    // Calculate growth for USDT
    const revenueGrowthUSDT = calculateGrowthPercentage(
      currentUSDT._sum.paymentAmount || 0,
      previousUSDT._sum.paymentAmount || 0
    )

    // Calculate growth for INSPI
    const revenueGrowthINSPI = calculateGrowthPercentage(
      currentINSPI._sum.paymentAmount || 0,
      previousINSPI._sum.paymentAmount || 0
    )

    // Format service usage data
    const services = ['Chat', 'Image Generation', 'Video Generation', 'Book Grading', 'Smart Contract Audit']
    const processedServiceUsage = services.map((service, index) => ({
      name: service,
      value: serviceUsage[index],
      currentMonth: currentMonthUsage[index]
    }))

    // Find most used service
    const maxServiceUsage = Math.max(...serviceUsage)
    const mostUsedServiceIndex = serviceUsage.indexOf(maxServiceUsage)

    // Split revenue by payment method
    const revenueByMethod = monthlyData[0].reduce((acc, curr) => {
      if (curr.paymentMethod === 'INSPI') {
        acc.INSPI += curr._sum.paymentAmount || 0
      } else if (curr.paymentMethod === 'USDT') {
        acc.USDT += curr._sum.paymentAmount || 0
      }
      return acc
    }, { INSPI: 0, USDT: 0 })

    const analytics = {
      users: {
        total: userStats.reduce((acc, stat) => acc + stat._count.walletId, 0),
        byPlan: Object.fromEntries(
          userStats.map(stat => [stat.plan || 'none', stat._count.walletId])
        )
      },
      revenue: {
        total: {
          USDT: currentUSDT._sum.paymentAmount || 0,
          INSPI: currentINSPI._sum.paymentAmount || 0
        },
        monthly: {
          USDT: {
            current: currentUSDT._sum.paymentAmount || 0,
            previous: previousUSDT._sum.paymentAmount || 0,
            growth: revenueGrowthUSDT
          },
          INSPI: {
            current: currentINSPI._sum.paymentAmount || 0,
            previous: previousINSPI._sum.paymentAmount || 0,
            growth: revenueGrowthINSPI
          }
        }
      },
      credits: {
        total: creditsStats._sum.allowedCredits || 0,
        thisMonth: creditsStats._sum.creditUsed || 0,
        avgDaily: Math.round((creditsStats._sum.creditUsed || 0) / 30),
        usage: {
          peak: Math.max(...monthlyData[1].map(c => c._sum.creditUsed || 0))
        }
      },
      serviceStats: {
        total: serviceUsage.reduce((a, b) => a + b, 0),
        currentMonth: currentMonthUsage.reduce((a, b) => a + b, 0),
        mostUsed: {
          name: services[mostUsedServiceIndex],
          count: maxServiceUsage
        },
        byService: processedServiceUsage
      },
      charts: {
        monthly: processMonthlyData(monthlyData[0]),
        serviceUsage: processedServiceUsage
      },
      transactions: formattedTransactions,
      pagination: {
        total: totalCount,
        pageSize,
        currentPage: page,
        totalPages: Math.ceil(totalCount / pageSize)
      }
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error in admin analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}

// Helper functions
function calculateGrowthPercentage(current: number, previous: number): number {
  if (previous === 0) return 0
  return Number(((current - previous) / previous * 100).toFixed(1))
}
