import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper function to verify wallet signature
async function verifyWallet(authorization: string | null) {
  if (!authorization) {
    return null;
  }

  try {
    const walletId = authorization.replace('Bearer ', '');
    const user = await prisma.user.findUnique({
      where: { walletId },
    });
    return user;
  } catch (error) {
    console.error('Error verifying wallet:', error);
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const authorization = req.headers.get('authorization');
    if (!authorization) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const walletId = authorization.replace('Bearer ', '');
    
    // First get all unique session IDs
    const uniqueSessions = await prisma.chatHistory.findMany({
      where: { walletId },
      distinct: ['sessionId'],
      select: {
        sessionId: true,
        sessionName: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // For each session, get its latest message
    const sessionsWithLatestMessage = await Promise.all(
      uniqueSessions.map(async (session) => {
        const latestMessage = await prisma.chatHistory.findFirst({
          where: {
            sessionId: session.sessionId,
            walletId,
          },
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            userMessage: true,
            botMessage: true,
            createdAt: true,
            sessionName: true,
          },
        });

        return {
          sessionId: session.sessionId,
          sessionName: latestMessage?.sessionName || 'New Chat',
          lastMessage: latestMessage?.userMessage || latestMessage?.botMessage || '',
          createdAt: latestMessage?.createdAt.toISOString() || new Date().toISOString(),
        };
      })
    );

    return NextResponse.json(sessionsWithLatestMessage);
  } catch (error) {
    console.error('Error in sessions API:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
