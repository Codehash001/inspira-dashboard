'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Bot, MessageSquare, Send, Pencil, Trash2, ChevronRight, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/lib/use-wallet';
import { useChat } from 'ai/react';
import { DeleteConfirmModal } from '@/components/delete-confirm-modal';
import { format } from 'date-fns';
import { Markdown } from '@/components/ui/markdown';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ethers } from 'ethers';
import InspiraSubscriptionABI from '@/contract-abi/InspiraSubscription.json';
import { formatCredits } from "@/lib/format-credits";

const SUBSCRIPTION_ADDRESS = process.env.NEXT_PUBLIC_INSPIRA_SUBSCRIPTION_ADDRESS!;

interface ChatSession {
  id: string;
  sessionId: string;
  sessionName: string;
  createdAt: string;
  lastMessage: string;
}

interface GroupedSessions {
  [key: string]: ChatSession[];
}

export default function ChatHome() {
  const router = useRouter();
  const { address: walletId, isConnected, signer } = useWallet();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [input, setInput] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [subscription, setSubscription] = useState<{
    planType: number;
    subscribedAt: number;
    credits: number;
  } | null>(null);

  // Fetch subscription details
  useEffect(() => {
    if (signer && walletId) {
      fetchSubscriptionDetails();
    }
  }, [signer, walletId]);

  const fetchSubscriptionDetails = async () => {
    try {
      const contract = new ethers.Contract(
        SUBSCRIPTION_ADDRESS,
        InspiraSubscriptionABI.abi,
        signer
      );
      
      const sub = await contract.getUserSubscription(walletId);
      console.log('Subscription details:', sub);
      
      setSubscription({
        planType: Number(sub.planType),
        subscribedAt: Number(sub.subscribedAt),
        credits: Number(sub.credits),
      });
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscription(null);
    }
  };

  const modelOptions = [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini', requiresPlan: 0 },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', requiresPlan: 0 },
    { value: 'gpt-4o', label: 'GPT-4o', requiresPlan: 1 },
    { value: 'gpt-4o-realtime-preview', label: 'GPT-4 Realtime', requiresPlan: 1 },
    { value: 'gpt-4o-mini-realtime-preview', label: 'GPT-4 Mini Realtime', requiresPlan: 1 },
  ];

  const availableModels = modelOptions.filter(model => {
    if (!subscription) return model.requiresPlan === 0;
    return model.requiresPlan <= subscription.planType;
  });

  const { messages, input: chatInput, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    headers: {
      'Authorization': `Bearer ${walletId}`
    },
    body: {
      model: selectedModel
    },
    id: '',
    onFinish: async (message) => {
      if (!walletId) return;
      
      // Save both messages
      await Promise.all([
        // Save user message
        fetch('/api/chat/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${walletId}`
          },
          body: JSON.stringify({
            message: chatInput,
            sessionId: '',
            isAssistant: false
          })
        }),
        // Save bot message
        fetch('/api/chat/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${walletId}`
          },
          body: JSON.stringify({
            message: message.content,
            sessionId: '',
            isAssistant: true
          })
        })
      ]);

      // Navigate to the chat session
      router.push(`/chat/`);
    }
  });

  const handleStartNewChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !walletId) return;

    // Generate a new session ID
    const newSessionId = Date.now().toString();
    const userMessage = input.trim();
    
    try {
      // Send first message to chat API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${walletId}`
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userMessage }],
          isFirstMessage: true,
          model: selectedModel,
          sessionId: newSessionId,
          conversationId: newSessionId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      // Navigate to the chat session
      router.push(`/chat/${newSessionId}`);
    } catch (error) {
      console.error('Error starting new chat:', error);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${walletId}`
        }
      });

      if (response.ok) {
        setSessions(sessions.filter(s => s.sessionId !== sessionId));
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const handleStartEdit = (session: ChatSession) => {
    setEditingSessionId(session.sessionId);
    setNewName(session.sessionName);
    setTimeout(() => {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }, 0);
  };

  const handleFinishEdit = async (sessionId: string) => {
    if (!newName.trim()) {
      setEditingSessionId(null);
      return;
    }

    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${walletId}`
        },
        body: JSON.stringify({
          name: newName.trim()
        })
      });

      if (response.ok) {
        setSessions(sessions.map(s => 
          s.sessionId === sessionId 
            ? { ...s, sessionName: newName.trim() }
            : s
        ));
      }
    } catch (error) {
      console.error('Error renaming session:', error);
    }
    setEditingSessionId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, sessionId: string) => {
    if (e.key === 'Enter') {
      handleFinishEdit(sessionId);
    } else if (e.key === 'Escape') {
      setEditingSessionId(null);
    }
  };

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

  // Group sessions by date
  const groupedSessions = sessions.reduce((groups, session) => {
    const date = new Date(session.createdAt);
    const dateStr = format(date, 'M/d/yyyy');
    
    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
    groups[dateStr].push(session);
    return groups;
  }, {} as Record<string, ChatSession[]>);

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
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="flex h-12 w-12 mx-auto items-center justify-center mb-4">
              <Bot className="h-6 w-6 text-[#00FFD1]" />
            </div>
            <p className="text-gray-400 mb-4">
              Please connect your wallet to continue chatting.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-5rem)]">
      {/* Main content area */}
      <div className={cn(
        "flex-1 flex flex-col relative transition-all duration-300",
        showSidebar ? "mr-80" : "mr-0"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-gray-800/50">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
              <Bot className="h-5 w-5 text-[#00FFD1]" />
              <h1 className="text-lg font-medium">New Chat</h1>
            </div>
            <div className="flex items-center gap-4">
              <Select 
                value={selectedModel} 
                onValueChange={setSelectedModel}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((model) => (
                    <SelectItem 
                      key={model.value} 
                      value={model.value}
                    >
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowSidebar(!showSidebar)}
              >
                {showSidebar ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Welcome content */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="flex justify-center mb-6">
              <Bot className="h-12 w-12 text-[#00FFD1]" />
            </div>
            <h1 className="text-2xl font-semibold mb-3">Welcome to Inspira AI</h1>
            <p className="text-gray-400 text-sm mb-6">
              Start a new conversation below or select a previous chat from the sidebar
            </p>
          </div>
        </div>

        {/* Input area */}
        <div className="p-6 border-t border-gray-800/50">
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleStartNewChat} className="relative">
              <Input
                placeholder="Start a new chat..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={!isConnected}
                className="w-full pl-6 pr-14 py-6 bg-gray-800/30 border-gray-700/50 focus-visible:ring-1 focus-visible:ring-[#00FFD1] placeholder:text-gray-500 rounded-2xl"
              />
              <Button 
                type="submit" 
                disabled={!isConnected}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#00FFD1] hover:bg-[#00FFD1]/90 text-black rounded-xl p-2 h-auto transition-all"
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Chat history sidebar */}
      <div 
        className={cn(
          "fixed right-0 top-[5rem] bottom-0 w-80 border-l border-gray-800/50 bg-gray-900/30 flex flex-col transition-all duration-300 ease-in-out backdrop-blur-sm",
          showSidebar ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex-1 overflow-y-auto">
          {Object.entries(groupedSessions).map(([date, sessions]) => (
            <div key={date} className="py-4">
              <h3 className="text-xs font-medium text-gray-400 px-4 mb-2">
                {date === format(new Date(), 'M/d/yyyy') ? 'Today' : date}
              </h3>
              <div className="space-y-0.5">
                {sessions.map((session) => (
                  <div
                    key={session.sessionId}
                    onClick={() => router.push(`/chat/${session.sessionId}`)}
                    className="group px-4 py-3 hover:bg-gray-800/30 transition-all cursor-pointer"
                  >
                    <div className="min-w-0">
                      {editingSessionId === session.sessionId ? (
                        <input
                          ref={editInputRef}
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          onBlur={() => handleFinishEdit(session.sessionId)}
                          onKeyDown={(e) => handleKeyDown(e, session.sessionId)}
                          className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-[#00FFD1] rounded px-1 text-sm"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium truncate text-sm flex-1">
                              {session.sessionName || 'New Chat'}
                            </span>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartEdit(session);
                                }}
                                className="hover:text-[#00FFD1] transition-all"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteSessionId(session.sessionId);
                                }}
                                className="hover:text-red-500 transition-all"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 truncate">
                            {session.lastMessage || 'No messages yet'}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={!!deleteSessionId}
        onClose={() => setDeleteSessionId(null)}
        onConfirm={async () => {
          if (deleteSessionId) {
            await handleDeleteSession(deleteSessionId);
            setDeleteSessionId(null);
          }
        }}
      />
    </div>
  );
}
