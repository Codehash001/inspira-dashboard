import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { experimental_generateImage as generateImage } from 'ai';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

type DallE3Size = '1024x1024' | '1024x1792';
type DallE2Size = '256x256' | '512x512' | '1024x1024';
type Quality = 'standard' | 'hd';
type ModelType = 'DALL-E-2' | 'DALL-E-3';

// Base prices from OpenAI (USD)
const BASE_PRICES = {
  'DALL-E-3': {
    '1024x1024': {
      standard: 0.04,
      hd: 0.08
    },
    '1024x1792': {
      standard: 0.08,
      hd: 0.12
    }
  },
  'DALL-E-2': {
    '256x256': 0.016,
    '512x512': 0.018,
    '1024x1024': 0.02
  }
} as const;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Calculate credits needed for image generation
// 500 credits = $25 (with 20% profit margin)
// So, 1 credit = $25/500 = $0.05
function calculateCredits(model: ModelType, size: DallE2Size | DallE3Size, quality?: Quality): number {
  let basePrice;
  if (model === 'DALL-E-2') {
    basePrice = BASE_PRICES[model][size as DallE2Size];
  } else {
    basePrice = BASE_PRICES[model][size as DallE3Size][quality || 'standard'];
  }
  
  // Add 20% profit margin
  const priceWithMargin = basePrice * 1.2;
  
  // Convert to credits (1 credit = $0.05)
  // If base price is $0.04, with 20% margin it's $0.048
  // Credits needed = $0.048 / $0.05 = 0.96 credits
  return Number((priceWithMargin / 0.05).toFixed(2));
}

// For image generation, 1 image = 4000 tokens
function calculateTokens(): number {
  return 4000;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, model, size, quality, n = 1, walletId } = body as {
      prompt: string;
      model: ModelType;
      size: DallE2Size | DallE3Size;
      quality?: Quality;
      n?: number;
      walletId: string;
    };

    if (!prompt || !model || !size || !walletId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate credits needed
    const creditsPerImage = calculateCredits(model, size, quality);
    const totalCredits = creditsPerImage * (n || 1);
    const tokenUsed = calculateTokens() * (n || 1);

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

    if (!creditBalance || creditBalance.remainingBalance < totalCredits) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 400 }
      );
    }

    // Generate image using the experimental_generateImage method
    const response = await generateImage({
      model: model === 'DALL-E-3' ? openai.image('dall-e-3') : openai.image('dall-e-2'),
      prompt,
      n: n || 1,
      size: size as `${number}x${number}`,
    });

    if (!response.images || response.images.length === 0) {
      throw new Error('Failed to generate image');
    }

    // Upload to Cloudinary and save to database
    const results = await Promise.all(
      response.images.map(async (image) => {
        if (!image.base64) throw new Error('No image data received');

        try {
          // Upload to Cloudinary using the SDK
          const uploadResponse = await new Promise<UploadApiResponse>((resolve, reject) => {
            cloudinary.uploader.upload(
              `data:image/png;base64,${image.base64}`,
              {
                folder: 'generated_images',
                resource_type: 'image'
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result as UploadApiResponse);
              }
            );
          });

          // Save to database
          const imageGeneration = await prisma.imageGenerationHistory.create({
            data: {
              imageId: nanoid(),
              walletId,
              imageUrl: uploadResponse.secure_url,
              creditUsed: creditsPerImage,
              tokenUsed,
              resolution: size,
              prompt,
              quality: quality || 'standard',
            },
          });

          return {
            imageUrl: uploadResponse.secure_url,
            imageId: imageGeneration.imageId,
            publicId: uploadResponse.public_id,
          };
        } catch (error) {
          console.error('Cloudinary upload error:', error);
          throw new Error('Failed to upload image to Cloudinary');
        }
      })
    );

    // Update credit balance
    await prisma.creditBalance.update({
      where: {
        id: creditBalance.id,
      },
      data: {
        creditUsed: {
          increment: totalCredits,
        },
        remainingBalance: {
          decrement: totalCredits,
        },
      },
    });

    return NextResponse.json({
      success: true,
      images: results,
      creditsUsed: totalCredits,
      tokensUsed: tokenUsed,
      warnings: response.warnings,
    });

  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate image' },
      { status: 500 }
    );
  }
}
