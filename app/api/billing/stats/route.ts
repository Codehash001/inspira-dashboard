import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getContract } from '@/lib/contract';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletId = searchParams.get('walletId');

    if (!walletId) {
      return NextResponse.json({ error: 'Wallet ID is required' }, { status: 400 });
    }

    const contract = await getContract();

    // Get user data
    const user = await prisma.user.findUnique({
      where: { walletId },
      include: {
        creditBalances: {
          where: {
            expiredDate: { gt: new Date() }
          },
          orderBy: {
            expiredDate: 'desc'
          },
          take: 1
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get subscription details from contract
    const [freePlanCredits] = await contract.getPlanDetails(0);
    const [proPlanCredits, proInspiPrice, proUsdtPrice] = await contract.getPlanDetails(1);
    const [ultraPlanCredits, ultraInspiPrice, ultraUsdtPrice] = await contract.getPlanDetails(2);
    const additionalCredits = await contract.ADDITIONAL_CREDITS();
    const additionalCreditsInspiPrice = await contract.ADDITIONAL_CREDITS_INSPI_PRICE();
    const additionalCreditsUsdtPrice = await contract.ADDITIONAL_CREDITS_USDT_PRICE();

    // Get transaction history
    const transactions = await prisma.transaction.findMany({
      where: { walletId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Calculate total credits used
    const totalCreditsUsed = await prisma.$queryRaw<{ total: number }[]>`
      SELECT COALESCE(SUM(credit_used), 0) as total
      FROM (
        SELECT credit_used FROM chat_history WHERE wallet_id = ${walletId}
        UNION ALL
        SELECT credit_used FROM image_generation_history WHERE wallet_id = ${walletId}
        UNION ALL
        SELECT credit_used FROM video_generation_history WHERE wallet_id = ${walletId}
        UNION ALL
        SELECT credit_used FROM book_grading_history WHERE wallet_id = ${walletId}
        UNION ALL
        SELECT credit_used FROM smart_contract_audits WHERE wallet_id = ${walletId}
      ) as combined_usage
    `;

    // Get current active credit balance
    const activeBalance = user.creditBalances[0];

    const response = {
      currentPlan: user.plan || 'none',
      lastFreeClaim: user.lastFreeClaim,
      creditBalance: activeBalance ? {
        credits: activeBalance.allowedCredits,
        remaining: activeBalance.remainingBalance,
        used: activeBalance.creditUsed,
        expiredDate: activeBalance.expiredDate
      } : null,
      totalCreditsUsed: Number(totalCreditsUsed[0]?.total || 0),
      plans: {
        free: {
          credits: Number(freePlanCredits),
          price: { inspi: 0, usdt: 0 }
        },
        pro: {
          credits: Number(proPlanCredits),
          price: {
            inspi: Number(proInspiPrice),
            usdt: Number(proUsdtPrice) / 1e6
          }
        },
        ultra: {
          credits: Number(ultraPlanCredits),
          price: {
            inspi: Number(ultraInspiPrice),
            usdt: Number(ultraUsdtPrice) / 1e6
          }
        }
      },
      additionalCredits: {
        amount: Number(additionalCredits),
        price: {
          inspi: Number(additionalCreditsInspiPrice),
          usdt: Number(additionalCreditsUsdtPrice) / 1e6
        }
      },
      recentTransactions: transactions
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error fetching billing stats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch billing stats' },
      { status: 500 }
    );
  }
}
