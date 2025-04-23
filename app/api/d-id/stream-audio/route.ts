import { NextResponse } from 'next/server';

// D-ID API credentials 
const D_ID_API_KEY = process.env.D_ID_API_KEY || "REPLACE_WITH_YOUR_D_ID_API_KEY";
const D_ID_API_URL = "https://api.d-id.com";

export async function POST(request: Request) {
  try {
    const { streamId, sessionId, audio } = await request.json();

    if (!streamId || !sessionId || !audio) {
      return NextResponse.json(
        { error: "Stream ID, session ID, and audio data are required" },
        { status: 400 }
      );
    }

    // Stream audio data to D-ID
    const response = await fetch(`${D_ID_API_URL}/talks/streams/${streamId}/audio`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${D_ID_API_KEY}`
      },
      body: JSON.stringify({
        session_id: sessionId,
        audio: audio
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("D-ID stream audio error:", errorData);
      return NextResponse.json(
        { error: `Failed to stream audio: ${errorData.kind || response.statusText}` },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("D-ID API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
