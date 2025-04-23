import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';
import { checkCreditBalance, updateUserCredits } from '@/lib/credits';
import { ChatOpenAI } from "@langchain/openai";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { z } from 'zod';

const MODEL_PRICES: Record<string, number> = {
  'gpt-4': 10.00,
  'gpt-3.5-turbo': 0.60,
};

function calculateCredits(model: string, totalTokens: number): number {
  const pricePerMillion = MODEL_PRICES[model] || MODEL_PRICES['gpt-3.5-turbo'];
  const tokenCost = (totalTokens / 1_000_000) * pricePerMillion;
  return Number(((tokenCost * 1.2 * 500) / 25).toFixed(4));
}

const bookGradingSchema = z.object({
  bookName: z.string(),
  author: z.string(),
  languageLevel: z.string(),
  bookLanguage: z.string(),
  summary: z.string()
});

type DocumentAnalysis = z.infer<typeof bookGradingSchema>;

const analysisParser = new JsonOutputParser<DocumentAnalysis>();

const formatInstructions = `Respond only in valid JSON. Extract the following information from the text and return it in this exact format:
{
  "bookName": "exact name of the book",
  "author": "name of the author",
  "languageLevel": "language proficiency level in CEFR (C1-C2: Advanced, B1-B2: Intermediate, A1-A2: Basic). Provide a specific level (e.g., B2)",
  "bookLanguage": "the language in which the book is written (e.g., English, Spanish, French, etc.)",
  "summary": "leave empty string, will be filled later"
}`;

const analysisPrompt = ChatPromptTemplate.fromTemplate(
  `You are an expert language learning book analyzer. Your task is to carefully extract the book name, author name, and determine the CEFR language level of the text.

CEFR Language Levels:
- C1-C2: Advanced/Proficient User (Most complex)
- B1-B2: Independent/Intermediate User
- A1-A2: Basic/Beginner User (Least complex)

Analyze the content complexity, vocabulary, grammar structures, and overall language use to determine the appropriate CEFR level.

{format_instructions}

Text to analyze: {text}

Return the analysis in the specified JSON format.`
);

async function getStructuredAnalysis(text: string): Promise<DocumentAnalysis> {
  const model = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0
  });

  try {
    const response = await model.invoke(
      await analysisPrompt.format({
        format_instructions: formatInstructions,
        text: text
      })
    );

    return analysisParser.parse(`${response.content}`);
  } catch (error) {
    console.error('Error in analysis:', error);
    throw error;
  }
}

async function extractTextFromPDF(blob: Blob): Promise<string> {
  try {
    console.log('Loading PDF with WebPDFLoader...');
    const loader = new WebPDFLoader(blob);
    
    const docs = await loader.load();
    if (!docs || docs.length === 0) {
      throw new Error('No text content found in PDF');
    }
    
    // Take only first 10 pages if available
    const firstTenPages = docs.slice(0, 10);
    console.log(`Processing ${firstTenPages.length} pages...`);
    
    return firstTenPages.map(doc => doc.pageContent).join('\n\n');
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF. Please ensure the file is not corrupted.');
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('book');
    const walletId = formData.get('walletId') as string;
    
    console.log('Received request:', {
      fileType: file instanceof Blob ? file.type : typeof file,
      fileSize: file instanceof Blob ? file.size : 'N/A',
      walletId
    });

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!walletId) {
      return NextResponse.json({ error: 'No wallet ID provided' }, { status: 400 });
    }

    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: 'Invalid file format' }, { status: 400 });
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
    }

    try {
      // Extract text based on file type
      let text: string;
      if (file.type.includes('pdf')) {
        console.log('Parsing PDF file...');
        text = await extractTextFromPDF(file);
      } else if (file.type.includes('text/plain')) {
        text = await file.text();
      } else {
        return NextResponse.json(
          { error: `Unsupported file format: ${file.type}. Please upload a PDF or TXT file.` },
          { status: 400 }
        );
      }

      if (!text.trim()) {
        return NextResponse.json({ error: 'No readable text content found in the file' }, { status: 400 });
      }

      console.log('Text extracted successfully, length:', text.length);
      
      // Get structured analysis
      console.log('Getting structured analysis...');
      const analysis = await getStructuredAnalysis(text);

      // Generate summary using GPT-4
      console.log('Generating summary...');
      const model = new ChatOpenAI({
        modelName: "gpt-4",
        temperature: 0
      });

      const summaryResponse = await model.invoke(
        `Please provide short-length summary (approximately 100 words) of the following text and analyze its language complexity and written style:

${text.slice(0, 3000)}...`
      );
      
      const summary = summaryResponse.content.toString();
      console.log('Summary generated successfully');

      // Calculate credits
      const estimatedTokens = Math.ceil((text.length + summary.length) / 4);
      const creditUsed = calculateCredits('gpt-4', estimatedTokens);

      // Check credit balance before proceeding
      const hasEnoughCredits = await checkCreditBalance(walletId, creditUsed);
      if (!hasEnoughCredits) {
        return NextResponse.json(
          { error: 'Insufficient credits' },
          { status: 400 }
        );
      }

      // Deduct credits directly without creating a transaction
      const creditUpdate = await updateUserCredits({
        walletId,
        creditsToDeduct: creditUsed,
        action: 'book'
      });

      // Save to book grading history
      const bookGrading = await prisma.bookGradingHistory.create({
        data: {
          bookId: nanoid(),
          walletId,
          bookName: analysis.bookName,
          authorName: analysis.author,
          bookGrade: analysis.languageLevel,
          analysis: summary,
          creditUsed,
          tokenUsed: estimatedTokens
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          bookId: bookGrading.bookId,
          bookName: bookGrading.bookName,
          authorName: bookGrading.authorName,
          bookGrade: bookGrading.bookGrade,
          analysis: bookGrading.analysis,
          creditUsed,
          tokenUsed: estimatedTokens
        }
      });

    } catch (error: any) {
      console.error('Error processing file:', error);
      return NextResponse.json(
        { error: `Error processing file: ${error.message || 'Unknown error'}` },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('Error in POST handler:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}