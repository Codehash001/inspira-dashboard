'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Bot, MessageSquare, Send, ChevronRight, ChevronLast, ChevronFirst } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/lib/use-wallet';
import { ConnectButton } from '@/components/connect-button';

interface ChatSession {
  sessionId: string;
  sessionName: string;
  lastMessage: string;
  createdAt: string;
}

interface GroupedSessions {
  [key: string]: ChatSession[];
}

export default function ChatHome() {
  const router = useRouter();
  const { address: walletId, isConnected } = useWallet();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    if (!walletId) return;
    loadChatSessions();
  }, [walletId]);

  const loadChatSessions = async () => {
    try {
      const response = await fetch('/api/chat/sessions', {
        headers: {
          'Authorization': `Bearer ${walletId}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const handleStartNewChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !walletId) return;

    setIsLoading(true);
    const sessionId = Date.now().toString();
    const userMessage = input.trim();
    
    // Navigate immediately with the message
    router.push(`/chat/${sessionId}?message=${encodeURIComponent(userMessage)}`);

    // Handle database and chat in the background
    Promise.all([
      // Save message to database
      fetch('/api/chat/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${walletId}`
        },
        body: JSON.stringify({
          message: userMessage,
          sessionId,
          isAssistant: false
        })
      }),
      
      // Start chat request
      fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${walletId}`
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userMessage }],
          id: sessionId,
        }),
      })
    ]).catch(error => {
      console.error('Error in background tasks:', error);
    });
  };

  const groupSessionsByDate = (sessions: ChatSession[]): GroupedSessions => {
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    const oneMonth = 30 * oneDay;
    const threeMonths = 3 * oneMonth;

    return sessions.reduce((groups: GroupedSessions, session) => {
      const createdAt = new Date(session.createdAt);
      const diff = now.getTime() - createdAt.getTime();

      let group = '';
      if (diff < oneDay) {
        group = 'Today';
      } else if (diff < oneWeek) {
        group = 'Last 7 Days';
      } else if (diff < oneMonth) {
        group = 'Last Month';
      } else if (diff < threeMonths) {
        group = 'Last 3 Months';
      } else {
        group = 'Older';
      }

      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(session);
      return groups;
    }, {});
  };

  const groupedSessions = groupSessionsByDate(sessions);

  if (!isConnected) {
    return (
      <div className="h-[calc(100vh-5rem)]">
        <div className="px-6 py-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center">
                <Bot className="h-5 w-5 text-[#00FFD1]" />
              </div>
              <h1 className="text-lg font-medium text-white">Inspira AI Chat</h1>
            </div>
            <ConnectButton />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="flex h-12 w-12 mx-auto items-center justify-center mb-4">
              <Bot className="h-6 w-6 text-[#00FFD1]" />
            </div>
            <h2 className="text-xl font-medium text-white mb-2">
              Connect Your Wallet
            </h2>
            <p className="text-gray-400 mb-4">
              Please connect your wallet to start chatting with AI.
            </p>
            <ConnectButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-5rem)] flex">
      {/* Main Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col relative transition-all duration-300",
        showSidebar ? "mr-80" : "mr-0"
      )}>
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 px-6 py-4 border-b border-gray-800 backdrop-blur-sm z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center">
                <Bot className="h-5 w-5 text-[#00FFD1]" />
              </div>
              <h1 className="text-lg font-medium ">Inspira AI Chat</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSidebar(!showSidebar)}
              className="text-gray-400"
            >
              {showSidebar ? 
                <ChevronLast className="h-5 w-5" /> : 
                <ChevronFirst className="h-5 w-5" />
              }
            </Button>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="flex-1 flex items-center justify-center px-6" style={{ marginTop: '64px' }}>
          <div className="text-center">
            <div className="flex h-12 w-12 mx-auto items-center justify-center mb-4">
              <Bot className="h-6 w-6 text-[#00FFD1]" />
            </div>
            <h2 className="text-xl font-medium mb-2">
              Hey, it's Inspira AI Chat!
            </h2>
            <p className="text-gray-400">
              How can I help you today?
            </p>
          </div>
        </div>

        {/* Input Form */}
        <div className="absolute bottom-0 left-0 right-0 p-6 pt-8 border-t border-gray-800 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleStartNewChat} className="flex gap-4">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-transparent border-0 focus-visible:ring-1 focus-visible:ring-[#00FFD1] text-white"
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

      {/* Chat History Sidebar */}
      <div 
        className={cn(
          "w-80 border-l border-gray-800 overflow-hidden flex flex-col fixed right-0 top-20 bottom-0 transition-all duration-300",
          showSidebar ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex-1 overflow-y-auto">
          {Object.entries(groupedSessions).map(([group, sessions]) => (
            <div key={group}>
              <div className="px-4 py-2">
                <h3 className="text-sm font-medium text-gray-400">{group}</h3>
              </div>
              {sessions.map((session) => (
                <button
                  key={session.sessionId}
                  onClick={() => router.push(`/chat/${session.sessionId}`)}
                  className="w-full px-4 py-3 hover:bg-white/5 transition-colors text-left group"
                >
                  <h3 className="font-medium text-white text-sm truncate mb-1">
                    {session.sessionName || 'New Chat'}
                  </h3>
                  <p className="text-gray-400 text-xs truncate">
                    {session.lastMessage}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    {new Date(session.createdAt).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
