import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ethers } from 'ethers';
import { getContract } from '@/lib/contract';
import { getUserCredits } from '@/lib/credits';

interface SubscriptionRequest {
  action: 'subscribe' | 'unsubscribe' | 'buy_credits' | 'claim_free' | 'claim_free_credits';
  walletId: string;
  transactionHash?: string;
  paymentMethod?: 'INSPI' | 'USDT';
  paymentAmount?: number;
  creditsToAdd?: number;
  transactionFee?: number;
  plan?: 'free' | 'pro' | 'ultra';
  freeCredits?: number;
}

// Function to refresh credits by calling the credits endpoint
async function refreshCredits(walletId: string) {
  try {
    await fetch(`/api/credits?walletId=${walletId}`, {
      method: 'GET',
      cache: 'no-store'
    });
  } catch (error) {
    console.error('Error refreshing credits:', error);
  }
}

export async function POST(request: Request) {
  try {
    const body: SubscriptionRequest = await request.json();
    const {
      action,
      walletId,
      transactionHash,
      paymentMethod,
      paymentAmount = 0,
      creditsToAdd = 0,
      transactionFee = 0,
      plan,
      freeCredits = 0
    } = body;

    if (!walletId) {
      return NextResponse.json({ error: 'Wallet ID is required' }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    // Get contract instance
    const contract = await getContract();

    // Get free plan details (plan type 0 is free)
    const [credits] = await contract.getPlanDetails(0);
    const planFreeCredits = Number(credits);

    const result = await prisma.$transaction(async (tx) => {
      // Get or create user
      let user = await tx.user.findUnique({ where: { walletId } });
      if (!user) {
        user = await tx.user.create({
          data: {
            walletId,
            plan: 'free',
            lastFreeClaim: new Date()
          }
        });
      }

      switch (action) {
        case 'claim_free': {
          // Check contract state first
          const subscription = await contract.getUserSubscription(walletId);
          const hasClaimedFree = await contract.hasClaimedFree(walletId);
          
          // Check if user has active subscription
          const expiresAt = Number(subscription.expiresAt) * 1000; // Convert to milliseconds
          const isActive = subscription.planType > 0 || (subscription.planType === 0 && expiresAt > Date.now());
          
          if (isActive) {
            throw new Error('Cannot claim free credits while having an active subscription');
          }

          // Check if user is eligible for free plan
          const canClaimFree = !hasClaimedFree || 
            (subscription.planType === 0 && expiresAt <= Date.now());
             
          if (!canClaimFree) {
            throw new Error('Not eligible for free plan. Must wait for current free plan to expire.');
          }

          // Create transaction record
          const transaction = await tx.transaction.create({
            data: {
              walletId,
              transactionType: action,
              status: 'pending', // Will be updated to completed after frontend transaction
              paymentMethod: 'NONE',
              paymentAmount: 0,
              creditsAdded: planFreeCredits,
              transactionFee: 0,
              transactionNote: 'Free credits claimed'
            }
          });

          // Create credit balance (will be activated after frontend transaction)
          const thirtyDaysFromNow = new Date();
          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

          await tx.creditBalance.create({
            data: {
              walletId,
              plan: 'free',
              allowedCredits: planFreeCredits,
              expiredDate: thirtyDaysFromNow,
              remainingBalance: planFreeCredits,
              transactionId: transaction.id
            }
          });

          // Update user's last claim date (will be confirmed after frontend transaction)
          await tx.user.update({
            where: { walletId: user.walletId },
            data: {
              lastFreeClaim: new Date(),
              plan: 'free'
            }
          });

          // Refresh credits after transaction
          await refreshCredits(walletId);

          // Get updated credits after transaction
          const updatedCredits = await getUserCredits(walletId);

          return { transaction, message: 'Free credits claim initiated', credits: updatedCredits };
        }

        case 'claim_free_credits': {
          // Validate required fields
          if (!walletId || !transactionHash || typeof freeCredits !== 'number') {
            return NextResponse.json(
              { error: 'Missing required fields', received: { walletId, transactionHash, freeCredits } },
              { status: 400 }
            );
          }

          // Get or create user first
          let user = await tx.user.findUnique({ where: { walletId } });
          if (!user) {
            user = await tx.user.create({
              data: {
                walletId,
                plan: 'free',
                lastFreeClaim: new Date()
              }
            });
          }

          // Create transaction record first
          const transaction = await tx.transaction.create({
            data: {
              walletId,
              transactionType: action,
              status: 'pending',
              paymentMethod: 'NONE',
              paymentAmount: 0,
              creditsAdded: freeCredits,
              transactionHash,
              transactionFee: 0,
              transactionNote: 'Free credits claimed'
            }
          });

          // Calculate expiry date
          const thirtyDaysFromNow = new Date();
          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

          // Create credit balance with transaction reference
          const creditBalance = await tx.creditBalance.create({
            data: {
              walletId,
              plan: 'free',
              allowedCredits: freeCredits,
              remainingBalance: freeCredits,
              creditUsed: 0,
              expiredDate: thirtyDaysFromNow,
              usedFor: 'claim_free',
              transactionId: transaction.id
            }
          });

          // Update user's plan and last claim date
          await tx.user.update({
            where: { walletId: user.walletId },
            data: {
              lastFreeClaim: new Date(),
              plan: 'free'
            }
          });

          // Refresh credits after claiming free credits
          await refreshCredits(walletId);

          // Get updated credits after transaction
          const updatedCredits = await getUserCredits(walletId);

          return { transaction, creditBalance, message: 'Free credits claim initiated', credits: updatedCredits };
        }

        case 'subscribe': {
          if (!plan || !paymentMethod || !transactionHash) {
            throw new Error('Plan, payment method and transaction hash are required for subscription');
          }

          // Get plan details from contract
          const planIndex = plan === 'pro' ? 1 : 2; // 1 = Pro, 2 = Ultra
          const [credits, inspiPrice, usdtPrice] = await contract.getPlanDetails(planIndex);
          
          // Verify payment amount
          const expectedAmount = paymentMethod === 'INSPI' ? 
            Number(ethers.formatEther(inspiPrice.toString())) : 
            Number(usdtPrice) / 1e6;
          
          if (paymentAmount < expectedAmount) {
            throw new Error('Invalid payment amount');
          }

          // Create transaction record
          const transaction = await tx.transaction.create({
            data: {
              walletId,
              transactionType: action,
              transactionHash,
              status: 'completed',
              paymentMethod,
              paymentAmount: paymentAmount, // Store the actual amount paid by user
              creditsAdded: Number(credits),
              transactionFee,
              transactionNote: `Subscribed to ${plan} plan`
            }
          });

          // Create credit balance
          const thirtyDaysFromNow = new Date();
          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

          await tx.creditBalance.create({
            data: {
              walletId,
              plan,
              allowedCredits: Number(credits),
              expiredDate: thirtyDaysFromNow,
              remainingBalance: Number(credits),
              transactionId: transaction.id
            }
          });

          // Update user's plan
          await tx.user.update({
            where: { walletId },
            data: { plan }
          });

          // Refresh credits after transaction
          await refreshCredits(walletId);

          // Get updated credits after transaction
          const updatedCredits = await getUserCredits(walletId);

          return { transaction, message: `Successfully subscribed to ${plan} plan`, credits: updatedCredits };
        }

        case 'unsubscribe': {
          // Get free plan details from contract
          const [credits] = await contract.getPlanDetails(0); // 0 = Free plan

          // Create transaction record
          const transaction = await tx.transaction.create({
            data: {
              walletId,
              transactionType: action,
              status: 'completed',
              paymentMethod: 'NONE',
              paymentAmount: 0,
              creditsAdded: Number(credits),
              transactionFee: 0,
              transactionNote: 'Unsubscribed to free plan'
            }
          });

          // Create credit balance for free plan
          const thirtyDaysFromNow = new Date();
          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

          await tx.creditBalance.create({
            data: {
              walletId,
              plan: 'free',
              allowedCredits: Number(credits),
              expiredDate: thirtyDaysFromNow,
              remainingBalance: Number(credits),
              transactionId: transaction.id
            }
          });

          // Update user's plan
          await tx.user.update({
            where: { walletId },
            data: { plan: 'free' }
          });

          // Refresh credits after unsubscribe
          await refreshCredits(walletId);

          // Get updated credits after transaction
          const updatedCredits = await getUserCredits(walletId);

          return { transaction, message: 'Successfully unsubscribed to free plan', credits: updatedCredits };
        }

        case 'buy_credits': {
          if (!paymentMethod || !transactionHash) {
            throw new Error('Payment method and transaction hash are required for buying credits');
          }

          // Get additional credits price from contract
          const additionalCredits = await contract.ADDITIONAL_CREDITS();
          const additionalCreditsPrice = paymentMethod === 'INSPI' ? 
            await contract.ADDITIONAL_CREDITS_INSPI_PRICE() : 
            await contract.ADDITIONAL_CREDITS_USDT_PRICE();

          // Verify payment amount
          const expectedAmount = paymentMethod === 'INSPI' ? 
            Number(ethers.formatEther(additionalCreditsPrice.toString())) : 
            Number(additionalCreditsPrice) / 1e6;

          if (paymentAmount < expectedAmount) {
            throw new Error('Invalid payment amount');
          }

          // Create transaction record
          const transaction = await tx.transaction.create({
            data: {
              walletId,
              transactionType: action,
              transactionHash,
              status: 'completed',
              paymentMethod,
              paymentAmount: paymentAmount, // Use the actual payment amount from frontend
              creditsAdded: Number(additionalCredits),
              transactionFee,
              transactionNote: 'Additional credits purchased'
            }
          });

          // Get current active credit balance
          const currentBalance = await tx.creditBalance.findFirst({
            where: {
              walletId,
              expiredDate: { gt: new Date() },
              plan: { not: 'free' }
            },
            orderBy: { expiredDate: 'desc' }
          });

          if (!currentBalance) {
            throw new Error('No active subscription found');
          }

          // Update credit balance
          await tx.creditBalance.update({
            where: { id: currentBalance.id },
            data: {
              allowedCredits: currentBalance.allowedCredits + Number(additionalCredits),
              remainingBalance: currentBalance.remainingBalance + Number(additionalCredits)
            }
          });

          // Refresh credits after buying credits
          await refreshCredits(walletId);

          // Get updated credits after transaction
          const updatedCredits = await getUserCredits(walletId);

          return { transaction, message: 'Additional credits purchased successfully', credits: updatedCredits };
        }

        default:
          throw new Error('Invalid transaction type');
      }
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process subscription' },
      { status: 400 }
    );
  }
}
