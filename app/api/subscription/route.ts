import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateUserCredits, initializeUserCredits } from '@/lib/credits';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Received request body:', body);

    const { action, walletId, plan, transactionHash, additionalCredits, credits, paymentToken } = body;

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

    // Initialize user if not exists
    await initializeUserCredits(walletId);

    // Record the transaction
    const transaction = await prisma.transaction.create({
      data: {
        walletId,
        transactionType: action,
        transactionHash,
        tokenAmount: additionalCredits || credits || body.freeCredits || 0,
        status: 'completed',
        paymentMethod: paymentToken || 'INSPI',
        transactionNote: `${action} - ${plan || 'free'} plan`
      },
    });

    let creditUpdateResult;

    // Handle different actions
    switch (action) {
      case 'subscribe': {
        // Update user's plan
        await prisma.user.update({
          where: { walletId },
          data: { plan }
        });

        // Add subscription credits
        creditUpdateResult = await updateUserCredits({
          walletId,
          creditsToAdd: credits,
          action: 'subscribe',
          plan
        });
        break;
      }

      case 'unsubscribe': {
        // Update user's plan to free
        await prisma.user.update({
          where: { walletId },
          data: { plan: 'free' }
        });

        // Add free plan credits
        creditUpdateResult = await updateUserCredits({
          walletId,
          creditsToAdd: body.freeCredits,
          action: 'unsubscribe',
          plan: 'free'
        });
        break;
      }

      case 'claim_free_credits': {
        creditUpdateResult = await updateUserCredits({
          walletId,
          creditsToAdd: body.freeCredits,
          action: 'claim_free',
          plan: 'free'
        });
        break;
      }

      case 'buy_credits': {
        creditUpdateResult = await updateUserCredits({
          walletId,
          creditsToAdd: additionalCredits,
          action: 'purchase',
          plan: (await prisma.user.findUnique({ where: { walletId } }))?.plan || 'free'
        });
        break;
      }

      default:
        throw new Error(`Invalid action: ${action}`);
    }

    if (!creditUpdateResult?.success) {
      throw new Error(creditUpdateResult?.error || 'Failed to update credits');
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        transaction,
        creditUpdate: creditUpdateResult
      }
    });
  } catch (error) {
    console.error('Subscription error:', error);
    
    // Handle different types of errors
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    const isValidationError = errorMessage.includes('required') || 
                            errorMessage.includes('already') ||
                            errorMessage.includes('not found');
    
    return NextResponse.json({ 
      success: false,
      error: errorMessage
    }, { 
      status: isValidationError ? 400 : 500 
    });
  }
}
