import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// This endpoint allows checking the status of a video by its ID
// Set to the same timeout as video generation to ensure we can handle long-running video checks
export const maxDuration = 600; // 10 minutes timeout

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    // Get video from database
    const video = await prisma.videoGenerationHistory.findUnique({
      where: { videoId: videoId },
      select: {
        id: true,
        videoId: true,
        prompt: true,
        status: true,
        videoUrl: true,
        error: true,
        createdAt: true,
      },
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Map database status to API response - standardize on lowercase status values
    let responseStatus = 'processing';
    
    // Convert to lowercase and normalize status values
    const normalizedStatus = video.status.toLowerCase();
    
    if (normalizedStatus === 'completed') {
      responseStatus = 'completed';
    } else if (normalizedStatus === 'failed') {
      responseStatus = 'failed';
    } else if (normalizedStatus === 'pending') {
      responseStatus = 'pending';
    }

    return NextResponse.json({
      videoId: video.videoId,
      status: responseStatus,
      videoUrl: video.videoUrl || null,
      prompt: video.prompt,
      error: video.error || null,
      createdAt: video.createdAt,
    });
  } catch (error) {
    console.error('Error checking video status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check video status' },
      { status: 500 }
    );
  }
}
