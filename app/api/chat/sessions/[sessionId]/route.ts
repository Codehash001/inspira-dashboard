import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Handle session rename
export async function PATCH(
  req: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    const authorization = req.headers.get('authorization');
    if (!authorization) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const walletId = authorization.replace('Bearer ', '');

    const { name } = await req.json();

    // Update session name
    await prisma.chatHistory.updateMany({
      where: {
        sessionId: params.sessionId,
        walletId,
      },
      data: {
        sessionName: name,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating session:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// Handle session deletion
export async function DELETE(
  req: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    const authorization = req.headers.get('authorization');
    if (!authorization) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const walletId = authorization.replace('Bearer ', '');

    // Delete all messages in the session
    await prisma.chatHistory.deleteMany({
      where: {
        sessionId: params.sessionId,
        walletId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
