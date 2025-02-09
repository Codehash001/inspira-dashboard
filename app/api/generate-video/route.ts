import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
const MINIMAX_GROUP_ID = process.env.MINIMAX_GROUP_ID;
const MINIMAX_API_URL = 'https://api.minimaxi.chat/v1';

// Credit costs for different models
const MODEL_CREDIT_COSTS = {
  'video-01': 8,
  'video-01-live2d': 8,
  'S2V-01': 11
};

interface MiniMaxResponse {
  task_id: string;
  base_resp: {
    status_code: number;
    status_msg: string;
  };
}

interface QueryResponse {
  status: 'Preparing' | 'Processing' | 'Success' | 'Fail';
  file_id?: string;
}

interface FileResponse {
  file: {
    file_id: string;
    bytes: number;
    created_at: number;
    filename: string;
    purpose: string;
    download_url: string;
  };
  base_resp: {
    status_code: number;
    status_msg: string;
  };
}

async function createVideoGenerationTask(prompt: string) {
  const response = await fetch(`${MINIMAX_API_URL}/video_generation`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MINIMAX_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'video-01',
      prompt,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create video generation task: ${response.statusText}`);
  }

  return await response.json() as MiniMaxResponse;
}

async function queryVideoGenerationStatus(taskId: string): Promise<QueryResponse> {
  const response = await fetch(
    `${MINIMAX_API_URL}/query/video_generation?task_id=${taskId}`,
    {
      headers: {
        'Authorization': `Bearer ${MINIMAX_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to query video status: ${response.statusText}`);
  }

  return await response.json();
}

async function getVideoDownloadUrl(fileId: string): Promise<string> {
  const response = await fetch(
    `${MINIMAX_API_URL}/files/retrieve?GroupId=${MINIMAX_GROUP_ID}&file_id=${fileId}`,
    {
      headers: {
        'Authorization': `Bearer ${MINIMAX_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get video download URL: ${response.statusText}`);
  }

  const data = await response.json() as FileResponse;
  return data.file.download_url;
}

async function deductCredits(walletId: string, creditsRequired: number): Promise<void> {
  // Get valid credit balances
  const validBalances = await prisma.creditBalance.findMany({
    where: {
      walletId,
      expiredDate: {
        gt: new Date(),
      },
      remainingBalance: {
        gt: 0,
      },
    },
    orderBy: {
      expiredDate: 'asc', // Use credits that expire soonest first
    },
  });

  let remainingCreditsToDeduct = creditsRequired;
  const updates = [];

  for (const balance of validBalances) {
    if (remainingCreditsToDeduct <= 0) break;

    const creditsToDeductFromBalance = Math.min(
      balance.remainingBalance,
      remainingCreditsToDeduct
    );

    updates.push(
      prisma.creditBalance.update({
        where: { id: balance.id },
        data: {
          remainingBalance: balance.remainingBalance - creditsToDeductFromBalance,
          creditUsed: balance.creditUsed + creditsToDeductFromBalance,
          usedFor: 'video_generation',
        },
      })
    );

    remainingCreditsToDeduct -= creditsToDeductFromBalance;
  }

  if (remainingCreditsToDeduct > 0) {
    throw new Error('Insufficient credits');
  }

  // Execute all updates in a transaction
  await prisma.$transaction(updates);
}

export async function POST(req: NextRequest) {
  if (!MINIMAX_API_KEY || !MINIMAX_GROUP_ID) {
    return NextResponse.json(
      { error: 'MiniMax API configuration is missing' },
      { status: 500 }
    );
  }

  try {
    const { prompt, walletId } = await req.json();

    if (!prompt || !walletId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check and deduct credits before generating video
    const creditsRequired = MODEL_CREDIT_COSTS['video-01'];
    await deductCredits(walletId, creditsRequired);

    // Create video generation task
    const taskResponse = await createVideoGenerationTask(prompt);
    
    // Start polling for status (max 5 minutes)
    const maxAttempts = 30; // 30 attempts * 10 seconds = 5 minutes
    let attempts = 0;
    let videoUrl = '';
    
    while (attempts < maxAttempts) {
      const statusResponse = await queryVideoGenerationStatus(taskResponse.task_id);
      
      if (statusResponse.status === 'Success' && statusResponse.file_id) {
        videoUrl = await getVideoDownloadUrl(statusResponse.file_id);
        break;
      } else if (statusResponse.status === 'Fail') {
        throw new Error('Video generation failed');
      }
      
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      attempts++;
    }

    if (!videoUrl) {
      throw new Error('Video generation timed out');
    }

    // Save the video generation history
    const videoHistory = await prisma.videoGenerationHistory.create({
      data: {
        videoId: taskResponse.task_id,
        videoUrl,
        prompt,
        resolution: '1080p',
        quality: 'standard',
        walletId,
        creditUsed: creditsRequired,
        tokenUsed: 5000,
        model: 'video-01',
      },
    });

    return NextResponse.json({
      videos: [{
        videoUrl: videoHistory.videoUrl,
        videoId: videoHistory.videoId,
        prompt: videoHistory.prompt,
      }],
      creditUsed: videoHistory.creditUsed,
      tokenUsed: videoHistory.tokenUsed,
    });

  } catch (error) {
    console.error('Error generating video:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate video' },
      { status: 500 }
    );
  }
}
