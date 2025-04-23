import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkCreditBalance, updateUserCredits } from '@/lib/credits';
import Replicate from 'replicate';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse } from 'cloudinary';

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Credit costs for different models
const MODEL_CREDIT_COSTS = {
  'video-01': 16
};

// Type definitions for Replicate output
type ReplicateOutput = string | FileOutput | FileOutput[];

interface FileOutput {
  url: () => Promise<string>;
}

interface CloudinaryUploadResult {
  asset_id?: string;
  public_id: string;
  version: number;
  format: string;
  resource_type: string;
  created_at: string;
  bytes: number;
  type: string;
  url: string;
  secure_url: string;
  width: number;
  height: number;
}

async function uploadToCloudinary(videoUrl: string): Promise<CloudinaryUploadResult> {
  try {
    console.log('Starting Cloudinary upload for:', videoUrl);
    
    // First, fetch the video data
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.statusText}`);
    }

    // Convert the video data to a buffer
    const buffer = await response.arrayBuffer();
    const base64Data = Buffer.from(buffer).toString('base64');
    const dataUri = `data:video/mp4;base64,${base64Data}`;

    // Upload to Cloudinary using data URI
    const uploadResult = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      cloudinary.uploader.upload(dataUri, {
        resource_type: 'video',
        folder: 'generated-videos',
        format: 'mp4',
        transformation: [
          { width: 1280, height: 720, crop: 'scale' },
          { quality: 'auto' },
          { fetch_format: 'mp4' }
        ],
        eager: [
          { 
            format: 'mp4',
            video_codec: 'h264',
            bit_rate: '2500k',
            width: 1280,
            height: 720,
            crop: 'scale',
            fps: 30
          }
        ],
        eager_async: true,
        notification_url: process.env.CLOUDINARY_NOTIFICATION_URL,
        eager_notification_url: process.env.CLOUDINARY_NOTIFICATION_URL
      }, (error, result) => {
        if (error || !result) {
          console.error('Cloudinary upload error details:', error);
          reject(new Error(error?.message || 'Upload failed'));
        } else {
          // Convert the result to match our interface
          const cloudinaryResult: CloudinaryUploadResult = {
            asset_id: result.asset_id,
            public_id: result.public_id,
            version: result.version,
            format: result.format,
            resource_type: result.resource_type,
            created_at: result.created_at,
            bytes: result.bytes,
            type: result.type,
            url: result.url,
            secure_url: result.secure_url,
            width: result.width || 0,
            height: result.height || 0
          };
          resolve(cloudinaryResult);
        }
      });
    });

    console.log('Cloudinary upload successful:', {
      url: uploadResult.secure_url,
      format: uploadResult.format,
      version: uploadResult.version,
      bytes: uploadResult.bytes,
      type: uploadResult.type,
      dimensions: `${uploadResult.width}x${uploadResult.height}`
    });

    // Check if the video is accessible
    let isProcessed = false;
    let attempts = 0;
    const maxAttempts = 30;
    const startTime = Date.now();

    while (!isProcessed && attempts < maxAttempts) {
      try {
        const checkResponse = await fetch(uploadResult.secure_url);
        if (checkResponse.ok) {
          const contentType = checkResponse.headers.get('content-type');
          if (contentType && contentType.includes('video')) {
            isProcessed = true;
            const processingTime = (Date.now() - startTime) / 1000;
            console.log('Video processing complete after', processingTime.toFixed(1), 'seconds');
            break;
          }
        }
      } catch (error) {
        console.log('Waiting for video processing... Attempt:', attempts + 1);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    if (!isProcessed) {
      console.warn('Video processing timeout after', maxAttempts, 'seconds');
    }

    return uploadResult;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to upload video: ${error.message}`);
    }
    throw new Error('Failed to upload video to cloud storage');
  }
}

async function validateVideoUrl(url: string): Promise<boolean> {
  try {
    console.log('Validating video URL:', url);
    const response = await fetch(url);
    const contentType = response.headers.get('content-type') || '';
    const isVideo = contentType.startsWith('video/') || 
                   contentType.includes('application/octet-stream') ||
                   contentType.includes('application/x-mpegURL') ||
                   url.endsWith('.mp4') ||
                   url.endsWith('.m3u8');
    
    console.log('Video validation result:', {
      ok: response.ok,
      contentType,
      isVideo,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    return response.ok && isVideo;
  } catch (error) {
    console.error('Video validation error:', error);
    return false;
  }
}

async function getVideoUrlFromOutput(output: ReplicateOutput): Promise<string> {
  try {
    console.log('Processing Replicate output:', output);

    if (Array.isArray(output)) {
      // Handle array output
      if (output.length === 0) {
        throw new Error('No video generated');
      }

      const firstOutput = output[0];
      if (typeof firstOutput === 'string') {
        return firstOutput;
      } else if (typeof firstOutput?.url === 'function') {
        return await firstOutput.url();
      }
    } else if (typeof output === 'string') {
      // Handle string output
      return output;
    } else if (typeof output?.url === 'function') {
      // Handle FileOutput object
      return await output.url();
    }

    console.error('Unexpected output format:', output);
    throw new Error('Unexpected response format from video generation API');
  } catch (error) {
    console.error('Error processing video URL:', error);
    throw error;
  }
}

// Configure for longer timeout
export const maxDuration = 600; // 10 minutes timeout

export async function POST(req: NextRequest) {
  if (!REPLICATE_API_TOKEN) {
    return NextResponse.json(
      { error: 'Video generation service is not configured.' },
      { status: 500 }
    );
  }

  try {
    const { prompt, walletId } = await req.json();

    if (!prompt || !walletId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const creditsRequired = MODEL_CREDIT_COSTS['video-01'];
    const hasEnoughCredits = await checkCreditBalance(walletId, creditsRequired);
    
    if (!hasEnoughCredits) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 400 }
      );
    }

    // Create initial record with pending status
    const videoGen = await prisma.videoGenerationHistory.create({
      data: {
        videoId: `video-${Date.now()}`,
        prompt,
        walletId,
        creditUsed: creditsRequired,
        tokenUsed: 5000,
        model: 'video-01',
        status: 'pending',
        videoUrl: '',
        resolution: ''
      },
    });

    // Start generation in background
    setTimeout(async () => {
      try {
        const replicate = new Replicate({ auth: REPLICATE_API_TOKEN });
        
        // Update to processing
        await prisma.videoGenerationHistory.update({
          where: { videoId: videoGen.videoId },
          data: { status: 'processing' }
        });

        const output = await replicate.run(
          "minimax/video-01",
          {
            input: {
              prompt: prompt,
              num_outputs: 1,
              width: 1280,
              height: 720,
              scheduler: "K_EULER_ANCESTRAL",
              num_inference_steps: 50,
              guidance_scale: 7.5,
              negative_prompt: "bad quality, blurry, pixelated, low resolution"
            }
          }
        );

        const videoUrl = Array.isArray(output) ? output[0] : output;
        if (!videoUrl) throw new Error('No output received');

        const cloudinaryResult = await uploadToCloudinary(videoUrl);
        
        // Update with success
        await prisma.videoGenerationHistory.update({
          where: { videoId: videoGen.videoId },
          data: {
            videoUrl: cloudinaryResult.secure_url,
            resolution: `${cloudinaryResult.width}x${cloudinaryResult.height}`,
            status: 'completed'
          },
        });

        await updateUserCredits({
          walletId,
          creditsToDeduct: creditsRequired,
          action: 'video'
        });
      } catch (error) {
        console.error('Generation error:', error);
        // Update with failure
        await prisma.videoGenerationHistory.update({
          where: { videoId: videoGen.videoId },
          data: {
            status: 'failed',
            error: error instanceof Error ? error.message : 'generation failed'
          },
        });
      }
    }, 0);

    // Return immediately with success
    return NextResponse.json({
      success: true,
      message: 'Video generation has started. Please check your gallery for the completed video.',
      redirectTo: '/gallery',
      videoId: videoGen.videoId,
      status: 'pending'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'server error' },
      { status: 500 }
    );
  }
}