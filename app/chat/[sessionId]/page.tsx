'use client';

import { useChat } from 'ai/react';
import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useWallet } from '@/lib/use-wallet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConnectButton } from '@/components/connect-button';
import { Bot, MessageSquare, Send, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function ChatSession() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { address: walletId, isConnected } = useWallet();
  const [sessionName, setSessionName] = useState('');
  const [messageCount, setMessageCount] = useState(0);
  const [initialMessageSet, setInitialMessageSet] = useState(false);

  const { messages, input, handleInputChange, handleSubmit: onSubmit, isLoading, setMessages, append } = useChat({
    api: '/api/chat',
    id: params.sessionId as string,
    headers: {
      'Authorization': `Bearer ${walletId}`
    },
    onFinish: async (message) => {
      if (!walletId) return;
      
      // Save assistant message
      await fetch('/api/chat/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${walletId}`
        },
        body: JSON.stringify({
          message: message.content,
          sessionId: params.sessionId,
          isAssistant: true
        })
      });

      // Increment message count and check if we need to generate a name
      const newCount = messageCount + 1;
      setMessageCount(newCount);

      if (newCount === 3) {
        // Generate conversation name using last 3 user messages
        const userMessages = messages
          .filter(m => m.role === 'user')
          .slice(-2) // Get last 2 user messages

        const response = await fetch('/api/chat/generate-name', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${walletId}`
          },
          body: JSON.stringify({
            messages: userMessages,
            sessionId: params.sessionId
          })
        });

        if (response.ok) {
          const { name } = await response.json();
          setSessionName(name);
        }
      }
    }
  });

  // Handle initial message from URL
  useEffect(() => {
    const message = searchParams.get('message');
    if (message && !initialMessageSet && walletId) {
      const userMessage = decodeURIComponent(message);
      
      setInitialMessageSet(true);
      setMessageCount(1);

      // Only trigger AI response, let useChat handle the message display
      append({
        id: Date.now().toString(),
        role: 'user',
        content: userMessage,
      });
    }
  }, [searchParams, initialMessageSet, walletId, append]);

  // Wrap handleSubmit to save user message
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !walletId) return;

    const userMessage = input.trim();

    // Save user message in the background
    fetch('/api/chat/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${walletId}`
      },
      body: JSON.stringify({
        message: userMessage,
        sessionId: params.sessionId,
        isAssistant: false
      })
    }).catch(error => {
      console.error('Error saving message:', error);
    });

    // Increment message count
    setMessageCount(prev => prev + 1);

    // Call original submit
    onSubmit(e);
  };

  useEffect(() => {
    if (!isConnected || !params.sessionId) {
      return;
    }

    // Load chat history when component mounts
    const loadChatHistory = async () => {
      try {
        const response = await fetch(`/api/chat/history/${params.sessionId}`, {
          headers: {
            'Authorization': `Bearer ${walletId}`
          }
        });
        
        if (response.ok) {
          const history = await response.json();
          if (history.length > 0) {
            setSessionName(history[0].sessionName);
            setMessageCount(history.length);
          }
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };

    loadChatHistory();
  }, [params.sessionId, walletId, isConnected]);

  if (!isConnected) {
    return (
      <div className="flex flex-col h-[calc(100vh-5rem)]">
        <div className="px-6 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1F1F1F]">
              <Bot className="h-5 w-5 text-[#00FFD1]" />
            </div>
            <h1 className="text-lg font-medium text-white">Inspira AI Chat</h1>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-lg bg-[#1F1F1F] mb-4">
              <Bot className="h-6 w-6 text-[#00FFD1]" />
            </div>
            <h2 className="text-xl font-medium text-white mb-2">
              Connect Your Wallet
            </h2>
            <p className="text-gray-400 mb-4">
              Please connect your wallet to continue the conversation.
            </p>
            <ConnectButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="p-2 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/chat">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#00FFD1]" />
              <h1 className="text-lg font-medium text-sm truncate">
                {sessionName || 'New Chat'}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {messages.map((message, i) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3 text-sm text-gray-200",
                message.role === 'assistant' ? "items-start" : "items-start justify-end"
              )}
            >
              {message.role === 'assistant' && (
                <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border bg-[#1F1F1F] text-[#00FFD1]">
                  <Bot className="h-5 w-5" />
                </div>
              )}
              <div
                className={cn(
                  "rounded-lg px-4 py-3 max-w-[85%] whitespace-pre-wrap",
                  message.role === 'assistant' ? "bg-[#1F1F1F]" : "bg-[#00FFD1] text-black"
                )}
              >
                {message.content}
              </div>
              {message.role === 'user' && (
                <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border bg-[#1F1F1F]">
                  <MessageSquare className="h-5 w-5 text-[#00FFD1]" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border bg-[#1F1F1F] text-[#00FFD1]">
                <Bot className="h-5 w-5" />
              </div>
              <div className="animate-pulse">Thinking...</div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="p-6 pt-8 border-t border-gray-800">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-4">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Type your message..."
              className="flex-1 bg-[#1F1F1F] border-0 focus-visible:ring-1 focus-visible:ring-[#00FFD1] text-white"
            />
            <Button 
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="bg-[#00FFD1] text-black hover:bg-[#00FFD1]/90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
