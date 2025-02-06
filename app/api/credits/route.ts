import { NextResponse } from 'next/server';
import { updateUserCredits, getUserCredits, checkCreditBalance } from '@/lib/credits';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const walletId = searchParams.get('walletId');

    if (!walletId) {
      return NextResponse.json({ 
        success: false,
        error: 'Wallet ID is required'
      }, { 
        status: 400 
      });
    }

    const credits = await getUserCredits(walletId);
    return NextResponse.json({ 
      success: true,
      data: credits
    });
  } catch (error) {
    console.error('Error getting credits:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get credits'
    }, { 
      status: 500 
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { walletId, creditsToDeduct, action } = body;

    if (!walletId || !creditsToDeduct || !action) {
      return NextResponse.json({ 
        success: false,
        error: 'Missing required fields'
      }, { 
        status: 400 
      });
    }

    // Check if user has enough credits
    const hasEnoughCredits = await checkCreditBalance(walletId, creditsToDeduct);
    if (!hasEnoughCredits) {
      return NextResponse.json({ 
        success: false,
        error: 'Insufficient credits'
      }, { 
        status: 400 
      });
    }

    // Deduct credits
    const result = await updateUserCredits({
      walletId,
      creditsToDeduct,
      action: action as any
    });

    if (!result.success) {
      return NextResponse.json({ 
        success: false,
        error: result.error
      }, { 
        status: 400 
      });
    }

    return NextResponse.json({ 
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error updating credits:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update credits'
    }, { 
      status: 500 
    });
  }
}
