import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { openai } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'
import { nanoid } from 'nanoid'

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

const auditResultSchema = z.object({
  analysis: z.string(),
  issues: z.array(z.object({
    severity: z.enum(['HIGH', 'MEDIUM', 'LOW']),
    title: z.string(),
    description: z.string(),
    recommendation: z.string()
  })),
  severity: z.enum(['HIGH', 'MEDIUM', 'LOW'])
});

export async function POST(req: NextRequest) {
  try {
    const headersList = req.headers
    const walletId = headersList.get("Authorization")?.replace("Bearer ", "")

    if (!walletId) {
      return NextResponse.json(
        { error: "Unauthorized - Please connect your wallet" },
        { status: 401 }
      )
    }

    const { contractCode, contractName } = await req.json()

    if (!contractCode) {
      return NextResponse.json(
        { error: "Contract code is required" },
        { status: 400 }
      )
    }

    const model = 'gpt-4';
    
    // Estimate token usage and required credits
    const estimatedTokens = Math.ceil(contractCode.length / 4);
    const estimatedCredits = calculateCredits(model, estimatedTokens);

    // Check if user has sufficient credits
    const creditBalance = await prisma.creditBalance.findFirst({
      where: {
        walletId,
        remainingBalance: { gt: 0 },
        expiredDate: { gt: new Date() }
      },
      orderBy: {
        expiredDate: 'asc'
      }
    });

    if (!creditBalance || creditBalance.remainingBalance < estimatedCredits) {
      return NextResponse.json(
        { error: `Insufficient credits. Required: ${estimatedCredits.toFixed(3)}` },
        { status: 402 }
      );
    }

    try {
      // Generate analysis using OpenAI
      const prompt = `You are a smart contract security expert. Analyze the following Solidity smart contract for security vulnerabilities, best practices, and potential improvements. Focus on:

1. Security vulnerabilities
2. Gas optimization
3. Code quality and best practices
4. Potential logical issues
5. Compliance with standards

Provide a detailed analysis with specific findings and recommendations. For each issue found, indicate the severity (HIGH, MEDIUM, or LOW).

Contract name: ${contractName}

Contract code:
${contractCode}

Format your response in markdown with clear sections and bullet points.`

      const { object } = await generateObject({
        model: openai(model),
        schema: auditResultSchema,
        prompt: prompt,
      });

      // Calculate actual token usage and credits
      const totalTokens = Math.ceil((contractCode.length + JSON.stringify(object).length) / 4);
      const creditUsed = calculateCredits(model, totalTokens);

      // Update credit balance directly using Prisma
      const newCreditUsed = parseFloat((creditBalance.creditUsed + creditUsed).toFixed(4));
      const newRemainingBalance = parseFloat((creditBalance.remainingBalance - creditUsed).toFixed(4));

      // Update credit balance
      await prisma.creditBalance.update({
        where: {
          id: creditBalance.id
        },
        data: {
          creditUsed: newCreditUsed,
          remainingBalance: newRemainingBalance
        }
      });

      // Determine overall severity based on content
      let severity: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW'
      if (object.analysis.toLowerCase().includes('high severity') || object.analysis.toLowerCase().includes('critical')) {
        severity = 'HIGH'
      } else if (object.analysis.toLowerCase().includes('medium severity')) {
        severity = 'MEDIUM'
      }

      // Save to database
      const audit = await prisma.smartContractAudit.create({
        data: {
          walletId,
          contractId: nanoid(),
          contractName: contractName || 'Untitled Contract',
          contractCode,
          analysis: object.analysis,
          severity: severity,
          vulnerabilities: object.issues,
          creditUsed,
          tokenUsed: totalTokens,
        }
      });

      return NextResponse.json({
        success: true,
        analysis: object.analysis,
        severity: severity,
        vulnerabilities: object.issues
      });

    } catch (error) {
      console.error("[SMART_CONTRACT_AUDIT_ERROR]", error);
      return NextResponse.json(
        { error: "Failed to analyze contract" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[SMART_CONTRACT_AUDIT_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}