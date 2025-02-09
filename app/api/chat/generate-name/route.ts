import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages, sessionId } = await req.json();
    const authorization = req.headers.get('authorization');
    
    if (!authorization) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const walletId = authorization.replace('Bearer ', '');

    // Filter only user messages
    const userMessages = messages
      .filter((m: { role: string }) => m.role === 'user')
      .map((m: { content: string }) => m.content);

    if (userMessages.length < 3) {
      return new NextResponse('Need at least 3 user messages', { status: 400 });
    }

    // Generate name using AI
    const { text: name } = await generateText({
      model: openai('gpt-4o-mini'),
      system: 'Generate a very short, concise title (2-4 words max) for this chat based on the main topic discussed. Use title case. No quotes, periods, or other punctuation. Example good names: AI Basics, Photo Editing Help, Website Design',
      messages: [{ role: 'user', content: userMessages.join('\n') }],
    });

    // Update session name in database
    await prisma.chatHistory.updateMany({
      where: {
        sessionId,
        walletId,
      },
      data: {
        sessionName: name.trim(),
      },
    });

    return NextResponse.json({ name: name.trim() });
  } catch (error) {
    console.error('Error generating name:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
