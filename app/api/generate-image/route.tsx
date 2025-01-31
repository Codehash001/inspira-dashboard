// app/api/generate-image/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { prompt, size, style, numberOfImages } = await req.json();

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }

  try {
    // Enhance prompt based on selected style
    let enhancedPrompt = prompt;
    if (style === 'vivid') {
      enhancedPrompt += ', vibrant colors, high contrast, dramatic lighting';
    } else if (style === 'natural') {
      enhancedPrompt += ', natural lighting, realistic colors, photorealistic';
    } else if (style === 'artistic') {
      enhancedPrompt += ', artistic style, creative interpretation, unique composition';
    }

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: enhancedPrompt,
        n: numberOfImages || 1,
        size: size || '1024x1024',
        quality: 'standard',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error: error.error.message }, { status: response.status });
    }

    const data = await response.json();
    const imageUrl = data.data[0].url;

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json({ error: 'Image generation failed' }, { status: 500 });
  }
}
