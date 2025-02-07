import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const authorization = req.headers.get('authorization');
    if (!authorization) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const walletId = authorization.replace('Bearer ', '');
    const { message, sessionId, isAssistant } = await req.json();

    // Get existing session name or use default
    const existingSession = await prisma.chatHistory.findFirst({
      where: {
        sessionId,
        walletId,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Save the message to chat history
    await prisma.chatHistory.create({
      data: {
        walletId,
        sessionId,
        sessionName: existingSession?.sessionName || 'New Chat',
        userMessage: isAssistant ? '' : message,
        botMessage: isAssistant ? message : '',
        conversationId: sessionId,
        creditUsed: 1,
        tokenUsed: 0,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving chat message:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
