import { prisma } from './prisma';

export interface CreditUpdateParams {
  walletId: string;
  creditsToDeduct?: number;
  creditsToAdd?: number;
  action: 'chat' | 'image' | 'video' | 'subscribe' | 'unsubscribe' | 'claim_free' | 'purchase';
  plan?: string;
}

export async function getUserCredits(walletId: string) {
  // Get all active credit balances (not expired)
  const activeBalances = await prisma.creditBalance.findMany({
    where: {
      walletId,
      expiredDate: {
        gt: new Date()
      }
    },
    orderBy: {
      expiredDate: 'asc' // Get earliest expiring credits first
    }
  });

  // Calculate total remaining balance
  const totalCredits = activeBalances.reduce((sum: any, balance: { remainingBalance: any; }) => sum + balance.remainingBalance, 0);

  return {
    activeBalances,
    totalCredits
  };
}

export async function updateUserCredits({ walletId, creditsToDeduct, creditsToAdd, action, plan }: CreditUpdateParams) {
  try {
    // If adding credits (subscribe, claim free, purchase)
    if (creditsToAdd) {
      await prisma.creditBalance.create({
        data: {
          walletId,
          plan: plan || 'free',
          allowedCredits: creditsToAdd,
          expiredDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          remainingBalance: creditsToAdd,
          creditUsed: 0,
          usedFor: action
        }
      });

      return { success: true, creditsAdded: creditsToAdd };
    }

    // If deducting credits (chat, image, video generation)
    if (creditsToDeduct) {
      let remainingDeduction = creditsToDeduct;
      const { activeBalances } = await getUserCredits(walletId);

      if (!activeBalances.length) {
        throw new Error('No active credit balance available');
      }

      const totalAvailable = activeBalances.reduce((sum: any, balance: { remainingBalance: any; }) => sum + balance.remainingBalance, 0);
      if (totalAvailable < creditsToDeduct) {
        throw new Error('Insufficient credits');
      }

      // Deduct from balances starting with earliest expiring
      for (const balance of activeBalances) {
        if (remainingDeduction <= 0) break;

        const deductFromThis = Math.min(remainingDeduction, balance.remainingBalance);
        await prisma.creditBalance.update({
          where: { id: balance.id },
          data: {
            remainingBalance: balance.remainingBalance - deductFromThis,
            creditUsed: balance.creditUsed + deductFromThis
          }
        });

        remainingDeduction -= deductFromThis;
      }

      return { success: true, creditsDeducted: creditsToDeduct };
    }

    return { success: false, error: 'No credit operation specified' };
  } catch (error) {
    console.error('Error updating credits:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update credits'
    };
  }
}

export async function initializeUserCredits(walletId: string) {
  const existingUser = await prisma.user.findUnique({
    where: { walletId },
    include: {
      creditBalances: {
        where: {
          expiredDate: {
            gt: new Date()
          }
        }
      }
    }
  });

  if (!existingUser) {
    await prisma.user.create({
      data: {
        walletId,
        plan: 'free',
        creditBalances: {
          create: {
            plan: 'free',
            allowedCredits: 0,
            remainingBalance: 0,
            creditUsed: 0,
            expiredDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            usedFor: 'initial'
          }
        }
      }
    });
  }

  return existingUser;
}

export async function checkCreditBalance(walletId: string, requiredCredits: number): Promise<boolean> {
  const { totalCredits } = await getUserCredits(walletId);
  return totalCredits >= requiredCredits;
}
