import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

// Token pricing per 1M tokens
const MODEL_PRICES: Record<string, number> = {
  'gpt-4': 10.00,
  'gpt-3.5-turbo': 0.60,
};

// Calculate credits needed for tokens
function calculateCredits(model: string, totalTokens: number): number {
  const pricePerMillion = MODEL_PRICES[model] || MODEL_PRICES['gpt-3.5-turbo'];
  const tokenCost = (totalTokens / 1_000_000) * pricePerMillion;
  // Add 20% profit margin
  const costWithMargin = tokenCost * 1.2;
  // Convert to credits (500 credits = $25) and round to 4 decimal points
  return Number(((costWithMargin * 500) / 25).toFixed(4));
}

// Function to get first 10 pages of content
function getFirst10Pages(text: string, charsPerPage: number = 1800): string {
  const first10Pages = text.slice(0, charsPerPage * 10);
  
  // Try to end at a sentence boundary
  const lastPeriodIndex = first10Pages.lastIndexOf('.');
  if (lastPeriodIndex > 0) {
    return first10Pages.slice(0, lastPeriodIndex + 1);
  }
  
  return first10Pages;
}

const bookGradingSchema = z.object({
  bookName: z.string(),
  authorName: z.string(),
  languageGrade: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  analysis: z.string()
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('book') as File;
    const walletId = formData.get('walletId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!walletId) {
      return NextResponse.json(
        { error: 'No wallet ID provided' },
        { status: 400 }
      );
    }

    // Check credit balance
    const creditBalance = await prisma.creditBalance.findFirst({
      where: {
        walletId,
        expiredDate: {
          gt: new Date(),
        },
      },
      orderBy: {
        expiredDate: 'asc',
      },
    });

    if (!creditBalance) {
      return NextResponse.json(
        { error: 'No active credit balance found' },
        { status: 402 }
      );
    }

    // Read the file content
    const fileContent = await file.text();
    
    // Get first 10 pages
    const sampleContent = getFirst10Pages(fileContent);
    
    const model = 'gpt-4';
    
    // Estimate token usage and check if user has enough credits
    const estimatedTokens = Math.ceil(sampleContent.length / 4);
    const estimatedCredits = calculateCredits(model, estimatedTokens);

    if (creditBalance.remainingBalance < estimatedCredits) {
      return NextResponse.json(
        { error: `Insufficient credits. Required: ${estimatedCredits.toFixed(3)}, Available: ${creditBalance.remainingBalance.toFixed(3)}` },
        { status: 402 }
      );
    }

    try {
      // Generate analysis using OpenAI
      const { object } = await generateObject({
        model: openai(model),
        schema: bookGradingSchema,
        prompt: `Analyze this book excerpt (first 10 pages) and determine:
        1. The book name
        2. The author name
        3. The CEFR language grade (A1-C2) based on vocabulary and sentence complexity
        4. A brief analysis of why you assigned this grade
        
        Book content:
        ${sampleContent}`,
      });

      // Calculate actual token usage and credits
      const totalTokens = Math.ceil((sampleContent.length + JSON.stringify(object).length) / 4);
      const creditUsed = calculateCredits(model, totalTokens);

      // Update credit balance
      await prisma.creditBalance.update({
        where: { id: creditBalance.id },
        data: {
          creditUsed: { increment: creditUsed },
          remainingBalance: { decrement: creditUsed }
        },
      });

      // Save to database
      const bookGradingHistory = await prisma.bookGradingHistory.create({
        data: {
          bookId: nanoid(),
          walletId,
          bookName: object.bookName || 'Unknown Book',
          authorName: object.authorName || 'Unknown Author',
          analysis: object.analysis,
          bookGrade: object.languageGrade,
          creditUsed,
          tokenUsed: totalTokens,
        },
      });

      return NextResponse.json({
        ...object,
        bookId: bookGradingHistory.bookId,
        creditUsed,
        tokenUsed: totalTokens,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('context_length_exceeded')) {
        return NextResponse.json(
          { error: 'The book excerpt is too long to analyze. Please try with a smaller portion.' },
          { status: 413 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Error processing book:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
