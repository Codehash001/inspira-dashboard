import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    const authorization = req.headers.get('authorization');
    if (!authorization) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const walletId = authorization.replace('Bearer ', '');
    console.log('Getting chat history for session:', params.sessionId);
    const history = await prisma.chatHistory.findMany({
      where: {
        sessionId: params.sessionId,
        walletId,
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        userMessage: true,
        botMessage: true,
        createdAt: true,
        sessionName: true,
      },
    });

    console.log('Found history:', history);
    // Transform the data into the format expected by the frontend
    const messages = history.flatMap((item: { userMessage: any; id: any; createdAt: any; botMessage: any; }) => {
      const result = [];
      if (item.userMessage) {
        result.push({
          id: `${item.id}-user`,
          content: item.userMessage,
          role: 'user',
          createdAt: item.createdAt,
        });
      }
      if (item.botMessage) {
        result.push({
          id: `${item.id}-assistant`,
          content: item.botMessage,
          role: 'assistant',
          createdAt: item.createdAt,
        });
      }
      return result;
    });

    console.log('Transformed messages:', messages);
    return NextResponse.json({
      messages,
      sessionName: history[0]?.sessionName || null,
    });
  } catch (error) {
    console.error('Error getting chat history:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
