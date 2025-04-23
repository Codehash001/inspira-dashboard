import { NextResponse } from 'next/server';

// D-ID API credentials 
const D_ID_API_KEY = process.env.D_ID_API_KEY || "REPLACE_WITH_YOUR_D_ID_API_KEY";
const D_ID_API_URL = "https://api.d-id.com";

export async function POST(request: Request) {
  try {
    const { streamId, sessionId } = await request.json();

    if (!streamId || !sessionId) {
      return NextResponse.json(
        { error: "Stream ID and session ID are required" },
        { status: 400 }
      );
    }

    // Stop the stream
    const response = await fetch(`${D_ID_API_URL}/talks/streams/${streamId}/stop`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${D_ID_API_KEY}`
      },
      body: JSON.stringify({
        session_id: sessionId
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("D-ID stop stream error:", errorData);
      return NextResponse.json(
        { error: `Failed to stop stream: ${errorData.kind || response.statusText}` },
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
