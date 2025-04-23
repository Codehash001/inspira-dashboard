"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingDots } from "@/components/loading-dots";

export default function ChatPage() {
  const router = useRouter();

  useEffect(() => {
    // Generate a new session ID using crypto.randomUUID()
    const newSessionId = crypto.randomUUID();
    
    // Redirect to the new chat session
    router.push(`/chat/${newSessionId}`);
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="flex items-center space-x-2">
        <span className="text-white">Creating a new chat session... </span>
      </div>
    </div>
  );
}
