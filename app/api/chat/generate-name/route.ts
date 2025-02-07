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
      .map((m: { content: string }) => m.content)
      .join('\n');

    // Generate name using AI
    const { text: name } = await generateText({
      model: openai('gpt-4-turbo'),
      system: 'Generate a brief, meaningful title (max 50 chars) for this conversation based on the user messages. Only respond with the title, nothing else.',
      prompt: userMessages,
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
