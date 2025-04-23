import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { initializeUserCredits } from '@/lib/credits';
import { ethers } from 'ethers';

// Number of block confirmations to wait for
const REQUIRED_CONFIRMATIONS = 2;

// Valid subscription plans
const VALID_PLANS = ['free', 'pro', 'ultra'] as const;
type SubscriptionPlan = typeof VALID_PLANS[number];

async function waitForTransactionConfirmation(transactionHash: string): Promise<boolean> {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
    
    // Wait for transaction receipt
    const receipt = await provider.waitForTransaction(transactionHash, REQUIRED_CONFIRMATIONS);
    
    // Check if transaction was successful
    if (receipt && receipt.status === 1) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error waiting for transaction confirmation:', error);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Received request body:', body);

    const { action, walletId, plan, transactionHash, additionalCredits, credits, paymentToken, paymentAmount } = body;

    // Validate required fields based on action
    let missingFields = [];
    
    // Common required fields
    if (!walletId) missingFields.push('walletId');
    if (!action) missingFields.push('action');
    if (!transactionHash) missingFields.push('transactionHash');

    // Action-specific required fields
    switch (action) {
      case 'subscribe':
        if (!plan) missingFields.push('plan');
        if (typeof credits !== 'number') missingFields.push('credits');
        // Validate plan type
        if (plan && !VALID_PLANS.includes(plan as SubscriptionPlan)) {
          return NextResponse.json({ 
            success: false,
            error: `Invalid plan type. Must be one of: ${VALID_PLANS.join(', ')}`
          }, { 
            status: 400 
          });
        }
        break;
      case 'unsubscribe':
        if (typeof body.freeCredits !== 'number') missingFields.push('freeCredits');
        break;
      case 'claim_free_credits':
        if (typeof body.freeCredits !== 'number') missingFields.push('freeCredits');
        break;
      case 'buy_credits':
        if (!additionalCredits) missingFields.push('additionalCredits');
        break;
    }

    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return NextResponse.json({ 
        success: false,
        error: 'Missing required fields',
        details: missingFields,
        receivedData: body
      }, { 
        status: 400 
      });
    }

    // First check if transaction already exists to prevent duplicates
    const existingTransaction = await prisma.transaction.findFirst({
      where: { transactionHash }
    });

    if (existingTransaction) {
      return NextResponse.json({ 
        success: false,
        error: 'Transaction already processed'
      }, { 
        status: 400 
      });
    }

    // Wait for transaction confirmation
    console.log(`Waiting for transaction ${transactionHash} confirmation...`);
    const isConfirmed = await waitForTransactionConfirmation(transactionHash);
    
    if (!isConfirmed) {
      return NextResponse.json({ 
        success: false,
        error: 'Transaction failed or not confirmed'
      }, { 
        status: 400 
      });
    }
    console.log(`Transaction ${transactionHash} confirmed successfully`);

    // Initialize user if not exists
    await initializeUserCredits(walletId);

    // Handle different actions
    switch (action) {
      case 'subscribe': {
        // Check current user plan
        const currentUser = await prisma.user.findUnique({
          where: { walletId }
        });

        if (!currentUser) {
          return NextResponse.json({ 
            success: false,
            error: 'User not found'
          }, { 
            status: 404 
          });
        }

        // Ensure user is on free plan before upgrading
        if (currentUser.plan !== 'free') {
          return NextResponse.json({ 
            success: false,
            error: 'You must be on the free plan to upgrade. Please unsubscribe from your current plan first.'
          }, { 
            status: 400 
          });
        }

        // First update user's plan
        await prisma.user.update({
          where: { walletId },
          data: { plan }
        });

        // Then create transaction
        const transaction = await prisma.transaction.create({
          data: {
            walletId,
            transactionType: action,
            transactionHash,
            status: 'completed',
            paymentMethod: paymentToken || 'INSPI',
            paymentAmount: paymentAmount,
            creditsAdded: credits,
            transactionFee: 0,
            transactionNote: `Subscribe to ${plan} plan`
          }
        });

        // Finally create credit balance
        await prisma.creditBalance.create({
          data: {
            walletId,
            plan,
            allowedCredits: credits,
            remainingBalance: credits,
            creditUsed: 0,
            expiredDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            usedFor: action,
            transactionId: transaction.id
          }
        });

        return NextResponse.json({ success: true, creditsAdded: credits });
      }

      case 'unsubscribe': {
        // First update user's plan to free
        await prisma.user.update({
          where: { walletId },
          data: { plan: 'free' }
        });

        // Then create transaction
        const transaction = await prisma.transaction.create({
          data: {
            walletId,
            transactionType: action,
            transactionHash,
            status: 'completed',
            paymentMethod: 'INSPI',
            paymentAmount: 0,
            creditsAdded: 0,
            transactionFee: 0,
            transactionNote: 'Unsubscribe and revert to free plan'
          }
        });

        // Finally create credit balance for free credits
        await prisma.creditBalance.create({
          data: {
            walletId,
            plan: 'free',
            allowedCredits: body.freeCredits,
            remainingBalance: body.freeCredits,
            creditUsed: 0,
            expiredDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            usedFor: action,
            transactionId: transaction.id
          }
        });

        return NextResponse.json({ success: true, creditsAdded: body.freeCredits });
      }

      case 'claim_free_credits': {
        // First create transaction
        const transaction = await prisma.transaction.create({
          data: {
            walletId,
            transactionType: action,
            transactionHash,
            status: 'completed',
            paymentMethod: 'INSPI',
            paymentAmount: 0,
            creditsAdded: body.freeCredits,
            transactionFee: 0,
            transactionNote: 'Claim free credits'
          }
        });

        // Then create credit balance
        await prisma.creditBalance.create({
          data: {
            walletId,
            plan: 'free',
            allowedCredits: body.freeCredits,
            remainingBalance: body.freeCredits,
            creditUsed: 0,
            expiredDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            usedFor: action,
            transactionId: transaction.id
          }
        });

        // Finally update last free claim timestamp
        await prisma.user.update({
          where: { walletId },
          data: { lastFreeClaim: new Date() }
        });

        return NextResponse.json({ success: true, creditsAdded: body.freeCredits });
      }

      case 'buy_credits': {
        // First create transaction
        const transaction = await prisma.transaction.create({
          data: {
            walletId,
            transactionType: action,
            transactionHash,
            status: 'completed',
            paymentMethod: paymentToken || 'INSPI',
            paymentAmount: paymentAmount,
            creditsAdded: additionalCredits,
            transactionFee: 0,
            transactionNote: 'Purchase additional credits'
          }
        });

        // Then create credit balance
        await prisma.creditBalance.create({
          data: {
            walletId,
            plan: 'free',
            allowedCredits: additionalCredits,
            remainingBalance: additionalCredits,
            creditUsed: 0,
            expiredDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            usedFor: action,
            transactionId: transaction.id
          }
        });

        return NextResponse.json({ success: true, creditsAdded: additionalCredits });
      }

      default:
        throw new Error(`Invalid action: ${action}`);
    }
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { 
      status: 500 
    });
  }
}
