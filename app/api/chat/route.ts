import { openai } from '@ai-sdk/openai';
import { streamText, generateText } from 'ai';
import { prisma } from '@/lib/prisma';
import { updateUserCredits, getUserCredits, checkCreditBalance } from '@/lib/credits';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

type ModelName = 
  | 'gpt-4o'
  | 'gpt-4o-audio-preview'
  | 'gpt-4o-realtime-preview'
  | 'gpt-4o-mini'
  | 'gpt-4o-mini-audio-preview'
  | 'gpt-4o-mini-realtime-preview'
  | 'gpt-3.5-turbo';

// Token pricing per 1M tokens
const MODEL_PRICES: Record<ModelName, number> = {
  'gpt-4o': 10.00,
  'gpt-4o-audio-preview': 10.00,
  'gpt-4o-realtime-preview': 20.00,
  'gpt-4o-mini': 0.60,
  'gpt-4o-mini-audio-preview': 0.60,
  'gpt-4o-mini-realtime-preview': 2.40,
  'gpt-3.5-turbo': 0.60
};

// Calculate credits needed for tokens
function calculateCredits(model: string, totalTokens: number): number {
  const modelName = model as ModelName;
  const pricePerMillion = MODEL_PRICES[modelName] || MODEL_PRICES['gpt-4o-mini'];
  const tokenCost = (totalTokens / 1_000_000) * pricePerMillion;
  // Add 20% profit margin
  const costWithMargin = tokenCost * 1.2;
  // Convert to credits (500 credits = $25) and round to 4 decimal points
  return Number(((costWithMargin * 500) / 25).toFixed(4));
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { messages, isFirstMessage = false, model = 'gpt-4o-mini', sessionId, conversationId } = json;
    console.log('Chat API called with:', { isFirstMessage, model, sessionId, conversationId, messages });
  
    const authHeader = req.headers.get('authorization');
    const walletId = authHeader?.replace('Bearer ', '');

    if (!walletId) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Check if user has enough credits for chat (estimate based on message length)
    // A simple estimation: 1 credit per 1000 characters
    const userMessage = messages[messages.length - 1].content;
    const estimatedCreditsNeeded = Math.max(0.1, Math.ceil(userMessage.length / 1000) * 0.1);
    const hasEnoughCredits = await checkCreditBalance(walletId, estimatedCreditsNeeded);
    
    if (!hasEnoughCredits) {
      return new Response(JSON.stringify({ 
        error: 'Insufficient credits', 
        requiredCredits: estimatedCreditsNeeded 
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // Ensure messages is an array and has the correct format
    if (!Array.isArray(messages)) {
      console.error('Invalid messages format:', messages);
      return new Response('Invalid messages format', { status: 400 });
    }

    console.log('Processing user message:', userMessage);

    // Get existing session name if it exists
    const existingSession = await prisma.chatHistory.findFirst({
      where: {
        sessionId,
        walletId
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        sessionName: true
      }
    });
    console.log('Found existing session:', existingSession);

    if (isFirstMessage) {
      // Use non-streaming for first message
      console.log('Handling first message...');
      const { text } = await generateText({
        model: openai(model),
        system: 'You are a helpful assistant.',
        messages,
      });
      console.log('Got AI response:', text);

      try {
        // Save first message without token/credit calculation
        const data = {
          walletId,
          sessionId,
          sessionName: existingSession?.sessionName || 'New Chat',
          userMessage,
          botMessage: text,
          conversationId: conversationId || Date.now().toString(),
          tokenUsed: 0,
          creditUsed: 0
        };
        console.log('Saving first message with data:', data);

        const savedMessage = await prisma.chatHistory.create({
          data
        });
        console.log('Successfully saved first message to database:', savedMessage);

        // Return text directly for first message
        return new Response(text, {
          headers: {
            'Content-Type': 'text/plain'
          }
        });
      } catch (error) {
        console.error('Error saving first message:', error);
        // Still return the response even if saving fails
        return new Response(text, {
          headers: {
            'Content-Type': 'text/plain'
          }
        });
      }
    } else {
      // Use streaming for subsequent messages
      
      console.log('Using model for streaming:', model);
      const result = streamText({
        model: openai(model),
        system: 'You are a helpful assistant.',
        messages,
        onFinish: async (completion) => {
          const totalTokens = completion.usage.totalTokens;
          const botMessageContent = completion.response?.messages?.[0]?.content;
          const botMessage = Array.isArray(botMessageContent) 
            ? botMessageContent.map(part => 'text' in part ? part.text : '').join('')
            : botMessageContent || '';

          if (botMessage) {
            const creditsNeeded = calculateCredits(model, totalTokens);
            
            try {
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

              if (creditBalance) {
                const newCreditUsed = parseFloat((creditBalance.creditUsed + creditsNeeded).toFixed(4));
                const newRemainingBalance = parseFloat((creditBalance.remainingBalance - creditsNeeded).toFixed(4));
                // Create chat history entry with both messages
                const savedMessage = await prisma.chatHistory.create({
                  data: {
                    walletId,
                    sessionId,
                    sessionName: existingSession?.sessionName || 'New Chat',
                    userMessage,
                    botMessage,
                    conversationId: conversationId || Date.now().toString(),
                    tokenUsed: totalTokens,
                    creditUsed: creditsNeeded
                  }
                });
                console.log('Saved streaming message to database:', savedMessage);

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
              }
            } catch (error) {
              console.error('Error saving streaming message:', error);
            }
          }
        }
      });

      const response = result.toDataStreamResponse();
      return response;
    }
  } catch (error) {
    console.error('Error in chat route:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
