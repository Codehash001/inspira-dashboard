import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const walletId = searchParams.get('walletId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!walletId) {
      return NextResponse.json(
        { error: 'Wallet ID is required' },
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;

    const [videos, total] = await Promise.all([
      prisma.videoGenerationHistory.findMany({
        where: { walletId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          videoId: true,
          videoUrl: true,
          createdAt: true,
          status: true,
          prompt: true,
          error: true,
          resolution: true,
          model: true
        }
      }),
      prisma.videoGenerationHistory.count({
        where: { walletId },
      }),
    ]);

    // Normalize status values to lowercase and ensure all fields are present
    const normalizedVideos = videos.map(video => ({
      ...video,
      status: video.status?.toLowerCase() || 'unknown',
      videoUrl: video.videoUrl || null,
      error: video.error || null
    }));

    return NextResponse.json({
      videos: normalizedVideos,
      total,
      hasMore: skip + limit < total,
    });

  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}
