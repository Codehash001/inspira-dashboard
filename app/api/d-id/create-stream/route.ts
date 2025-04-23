import { NextResponse } from 'next/server';

// D-ID API credentials 
const D_ID_API_KEY = process.env.D_ID_API_KEY || "REPLACE_WITH_YOUR_D_ID_API_KEY";
const D_ID_API_URL = "https://api.d-id.com";

export async function POST(request: Request) {
  try {
    const { sourceUrl } = await request.json();

    if (!sourceUrl) {
      return NextResponse.json(
        { error: "Source URL is required" },
        { status: 400 }
      );
    }

    // Create a stream session with D-ID
    const response = await fetch(`${D_ID_API_URL}/talks/streams`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${D_ID_API_KEY}`
      },
      body: JSON.stringify({
        source_url: sourceUrl,
        // Optional parameters
        driver_url: "bank://lively", // Animation driver
        config: {
          stitch: true
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("D-ID stream creation error:", errorData);
      return NextResponse.json(
        { error: `Failed to create stream: ${errorData.kind || response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Now create a WebRTC connection
    const iceResponse = await fetch(`${D_ID_API_URL}/talks/streams/${data.id}/sdp-offer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${D_ID_API_KEY}`
      },
      body: JSON.stringify({
        session_id: data.session_id
      })
    });

    if (!iceResponse.ok) {
      const errorData = await iceResponse.json();
      console.error("D-ID SDP offer error:", errorData);
      return NextResponse.json(
        { error: `Failed to get SDP offer: ${errorData.kind || iceResponse.statusText}` },
        { status: iceResponse.status }
      );
    }

    const iceData = await iceResponse.json();
    
    return NextResponse.json({
      streamId: data.id,
      sessionId: data.session_id,
      offer: iceData.offer
    });
  } catch (error) {
    console.error("D-ID API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
