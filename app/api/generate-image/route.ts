import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { experimental_generateImage as generateImage } from 'ai';
import { nanoid } from 'nanoid';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { updateUserCredits, getUserCredits, checkCreditBalance } from '@/lib/credits';
import { prisma } from '@/lib/prisma';

type DallE3Size = '1024x1024' | '1024x1792';
type DallE2Size = '256x256' | '512x512' | '1024x1024';

type ModelType = 'DALL-E-2' | 'DALL-E-3';

const BASE_PRICES = {
  'DALL-E-3': {
    '1024x1024': 0.04,
    '1024x1792': 0.08
  },
  'DALL-E-2': {
    '256x256': 0.016,
    '512x512': 0.018,
    '1024x1024': 0.02
  }
} as const;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

function calculateCredits(model: ModelType, size: DallE2Size | DallE3Size): number {
  let basePrice;
  if (model === 'DALL-E-2') {
    basePrice = BASE_PRICES[model][size as DallE2Size];
  } else {
    basePrice = BASE_PRICES[model][size as DallE3Size];
  }
  
  return Number(((basePrice * 1.2) / 0.05).toFixed(2)); // 20% profit margin, converted to credits
}

function calculateTokens(): number {
  return 4000;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, model, size, n = 1, walletId } = body as {
      prompt: string;
      model: ModelType;
      size: DallE2Size | DallE3Size;
      n?: number;
      walletId: string;
    };

    if (!prompt || !model || !size || !walletId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const creditsPerImage = calculateCredits(model, size);
    const totalCredits = creditsPerImage * n;
    const tokenUsed = calculateTokens() * n;

    // Check if the user has enough credits
    const hasEnoughCredits = await checkCreditBalance(walletId, totalCredits);
    if (!hasEnoughCredits) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 });
    }

    const response = await generateImage({
      model: model === 'DALL-E-3' ? openai.image('dall-e-3') : openai.image('dall-e-2'),
      prompt,
      n,
      size: size as `${number}x${number}`,
    });

    if (!response.images || response.images.length === 0) {
      throw new Error('Failed to generate image');
    }

    // Upload images to Cloudinary and store in DB
    const results = await Promise.all(
      response.images.map(async (image) => {
        if (!image.base64) throw new Error('No image data received');

        try {
          const uploadResponse = await new Promise<UploadApiResponse>((resolve, reject) => {
            cloudinary.uploader.upload(
              `data:image/png;base64,${image.base64}`,
              { folder: 'generated_images', resource_type: 'image' },
              (error, result) => (error ? reject(error) : resolve(result as UploadApiResponse))
            );
          });

          // Deduct credits after successful image generation
          await updateUserCredits({
            walletId,
            creditsToDeduct: creditsPerImage,
            action: 'image',
          });

           // Save image generation details to the database
           const imageGeneration = await prisma.imageGenerationHistory.create({
            data: {
              imageId: nanoid(),
              walletId,
              imageUrl: uploadResponse.secure_url,
              creditUsed: creditsPerImage,
              tokenUsed,
              resolution: size,
              prompt,

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
