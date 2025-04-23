import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Get the wallet ID from the query parameters
    const { searchParams } = new URL(request.url);
    const walletId = searchParams.get('walletId');

    if (!walletId) {
      return NextResponse.json(
        { error: 'Wallet ID is required' },
        { status: 400 }
      );
    }

    // Get total users count
    const totalUsers = await prisma.user.count();

    // Get credit usage data for the past 7 days
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const creditUsageData: {
      name: string; credits: number; // Round to 2 decimal places
    }[] = [];

    // Calculate date range for the past 7 days
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6); // Get data for 7 days (today + 6 previous days)
    
    // Set to beginning of day
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Fetch all history data for the past 7 days for the specific user
    const [chatHistory, imageHistory, videoHistory, bookHistory, auditHistory] = await Promise.all([
      // Chat history
      prisma.chatHistory.findMany({
        where: {
          walletId,
          createdAt: {
            gte: sevenDaysAgo
          }
        },
        select: {
          createdAt: true,
          creditUsed: true
        }
      }),
      
      // Image generation history
      prisma.imageGenerationHistory.findMany({
        where: {
          walletId,
          createdAt: {
            gte: sevenDaysAgo
          }
        },
        select: {
          createdAt: true,
          creditUsed: true
        }
      }),
      
      // Video generation history
      prisma.videoGenerationHistory.findMany({
        where: {
          walletId,
          createdAt: {
            gte: sevenDaysAgo
          }
        },
        select: {
          createdAt: true,
          creditUsed: true
        }
      }),
      
      // Book grading history
      prisma.bookGradingHistory.findMany({
        where: {
          walletId,
          createdAt: {
            gte: sevenDaysAgo
          }
        },
        select: {
          createdAt: true,
          creditUsed: true
        }
      }),
      
      // Smart contract audit history
      prisma.smartContractAudit.findMany({
        where: {
          walletId,
          createdAt: {
            gte: sevenDaysAgo
          }
        },
        select: {
          createdAt: true,
          creditUsed: true
        }
      })
    ]);

    // Combine all history data
    const allHistory = [
      ...chatHistory.map(item => ({ ...item, type: 'chat' })),
      ...imageHistory.map(item => ({ ...item, type: 'image' })),
      ...videoHistory.map(item => ({ ...item, type: 'video' })),
      ...bookHistory.map(item => ({ ...item, type: 'book' })),
      ...auditHistory.map(item => ({ ...item, type: 'audit' }))
    ];

    // Group by day of week and calculate total credits used
    const creditsByDay: Record<string, number> = {};
    
    // Initialize all days with 0 credits
    days.forEach(day => {
      creditsByDay[day] = 0;
    });

    // Sum credits by day
    allHistory.forEach(item => {
      const date = new Date(item.createdAt);
      const dayName = days[date.getDay() === 0 ? 6 : date.getDay() - 1]; // Convert to Mon-Sun format
      creditsByDay[dayName] += Number(item.creditUsed) || 0;
    });

    // Format data for the chart
    Object.keys(creditsByDay).forEach(day => {
      creditUsageData.push({
        name: day,
        credits: Number(creditsByDay[day].toFixed(4)) // Use exact values with 4 decimal places
      });
    });

    // Sort the data to ensure it's in the correct order (Mon-Sun)
    creditUsageData.sort((a, b) => {
      const dayOrder: Record<string, number> = { 'Mon': 0, 'Tue': 1, 'Wed': 2, 'Thu': 3, 'Fri': 4, 'Sat': 5, 'Sun': 6 };
      return dayOrder[a.name] - dayOrder[b.name];
    });

    // Calculate total credit usage for the current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [monthlyChat, monthlyImage, monthlyVideo, monthlyBook, monthlyAudit] = await Promise.all([
      // Chat history for this month
      prisma.chatHistory.aggregate({
        where: {
          walletId,
          createdAt: {
            gte: startOfMonth
          }
        },
        _sum: {
          creditUsed: true
        }
      }),
      
      // Image generation for this month
      prisma.imageGenerationHistory.aggregate({
        where: {
          walletId,
          createdAt: {
            gte: startOfMonth
          }
        },
        _sum: {
          creditUsed: true
        }
      }),
      
      // Video generation for this month
      prisma.videoGenerationHistory.aggregate({
        where: {
          walletId,
          createdAt: {
            gte: startOfMonth
          }
        },
        _sum: {
          creditUsed: true
        }
      }),
      
      // Book grading for this month
      prisma.bookGradingHistory.aggregate({
        where: {
          walletId,
          createdAt: {
            gte: startOfMonth
          }
        },
        _sum: {
          creditUsed: true
        }
      }),
      
      // Smart contract audit for this month
      prisma.smartContractAudit.aggregate({
        where: {
          walletId,
          createdAt: {
            gte: startOfMonth
          }
        },
        _sum: {
          creditUsed: true
        }
      })
    ]);

    // Calculate total monthly credit usage
    const monthlyCreditsUsed = 
      Number(monthlyChat._sum.creditUsed || 0) +
      Number(monthlyImage._sum.creditUsed || 0) +
      Number(monthlyVideo._sum.creditUsed || 0) +
      Number(monthlyBook._sum.creditUsed || 0) +
      Number(monthlyAudit._sum.creditUsed || 0);

    // Get user's plan
    const user = await prisma.user.findUnique({
      where: { walletId },
      select: { plan: true }
    });

    const userPlan = user?.plan || 'Free';

    return NextResponse.json({
      totalUsers,
      creditUsageData,
      monthlyCreditsUsed: Number(monthlyCreditsUsed.toFixed(4)),
      userPlan
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard analytics data' },
      { status: 500 }
    );
  }
}
