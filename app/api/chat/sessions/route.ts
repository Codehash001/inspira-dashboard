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
    
    // Get unique sessions with their latest message
    const sessions = await prisma.chatHistory.findMany({
      where: {
        walletId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      distinct: ['sessionId'],
      select: {
        sessionId: true,
        sessionName: true,
        userMessage: true,
        botMessage: true,
        createdAt: true,
      },
    });

    // Format the sessions
    const formattedSessions = sessions.map((session: { sessionId: any; sessionName: any; userMessage: any; botMessage: any; createdAt: { toISOString: () => any; }; }) => ({
      sessionId: session.sessionId,
      sessionName: session.sessionName || 'New Chat',
      lastMessage: session.userMessage || session.botMessage || '',
      createdAt: session.createdAt.toISOString(),
    }));

    return NextResponse.json(formattedSessions);
  } catch (error) {
    console.error('Error in sessions API:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
