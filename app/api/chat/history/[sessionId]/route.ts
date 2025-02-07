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
    const messages = await prisma.chatHistory.findMany({
      where: {
        sessionId: params.sessionId,
        walletId,
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        userMessage: true,
        botMessage: true,
        createdAt: true,
        sessionName: true,
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error in chat history API:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
