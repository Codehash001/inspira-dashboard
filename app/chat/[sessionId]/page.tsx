'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Bot, MessageSquare, Send, ArrowLeft, Plus, ChevronRight, ChevronLeft, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useWallet } from '@/lib/use-wallet';
import { useChat, Message as AIMessage } from 'ai/react';
import { LoadingDots } from '@/components/loading-dots';
import { format } from 'date-fns';
import { DeleteConfirmModal } from '@/components/delete-confirm-modal';
import { Markdown } from '@/components/ui/markdown';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { ethers } from 'ethers';
import InspiraSubscriptionABI from '@/contract-abi/InspiraSubscription.json';
import { formatCredits } from "@/lib/format-credits";

const SUBSCRIPTION_ADDRESS = process.env.NEXT_PUBLIC_INSPIRA_SUBSCRIPTION_ADDRESS!;

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: string;
}

interface ChatSession {
  id: string;
  sessionId: string;
  sessionName: string;
  createdAt: string;
  lastMessage: string;
}

export default function ChatSession() {
  const router = useRouter();
  const params = useParams();
  const { address: walletId, isConnected, signer } = useWallet();
  const [sessionName, setSessionName] = useState<string>('New Chat');
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [nameGenerated, setNameGenerated] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [subscription, setSubscription] = useState<{
    planType: number;
    subscribedAt: number;
    credits: number;
  } | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(false);
  const nameGeneratedRef = useRef(false);

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

  // Group sessions by date
  const groupedSessions = useMemo(() => {
    return sessions.reduce((groups: { [key: string]: ChatSession[] }, session) => {
      const date = format(new Date(session.createdAt), 'M/d/yyyy');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(session);
      return groups;
    }, {});
  }, [sessions]);

  // Load chat sessions
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

  const handleStartEdit = (session: ChatSession) => {
    setEditingSessionId(session.sessionId);
    setNewName(session.sessionName || '');
  };

  const handleFinishEdit = async (sessionId: string) => {
    if (!newName.trim() || !walletId) {
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
        setSessions(prev =>
          prev.map(session =>
            session.sessionId === sessionId
              ? { ...session, sessionName: newName.trim() }
              : session
          )
        );
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

  const handleDeleteSession = async (sessionId: string) => {
    if (!walletId) return;

    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${walletId}`
        }
      });

      if (response.ok) {
        setSessions(prev => prev.filter(session => session.sessionId !== sessionId));
        if (sessionId === params.sessionId) {
          router.push('/chat');
        }
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const { messages: chatMessages, input, handleInputChange, handleSubmit, isLoading, setMessages: setChatMessages } = useChat({
    api: '/api/chat',
    headers: {
      'Authorization': `Bearer ${walletId}`
    },
    body: {
      model: selectedModel,
      sessionId: params.sessionId,
      conversationId: Date.now().toString(),
      isFirstMessage: false
    },
    id: params.sessionId as string,
    initialMessages: [],
    onFinish: async (message) => {
      // Check if we need to generate a name
      if (!nameGenerated && sessionName === 'New Chat') {
        const userMessages = chatMessages.filter(m => m.role === 'user');
        
        if (userMessages.length === 2) { // Current message will be the 3rd
          try {
            const response = await fetch('/api/chat/generate-name', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${walletId}`
              },
              body: JSON.stringify({
                messages: [...chatMessages, { role: 'user', content: input }],
                sessionId: params.sessionId
              })
            });

            if (response.ok) {
              const { name } = await response.json();
              setSessionName(name);
              setNameGenerated(true);
            }
          } catch (error) {
            console.error('Error generating session name:', error);
          }
        }
      }
    }
  });

  // Load chat history on mount
  useEffect(() => {
    const loadHistory = async () => {
      if (!walletId || !params?.sessionId || historyLoaded) return;
      
      try {
        const response = await fetch(`/api/chat/history/${params.sessionId}`, {
          headers: {
            'Authorization': `Bearer ${walletId}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data.messages)) {
            const formattedMessages = data.messages.map((msg: Message) => ({
              id: msg.id,
              content: msg.content,
              role: msg.role as "system" | "user" | "assistant" | "data",
              createdAt: new Date(msg.createdAt)
            }));
            setChatMessages(formattedMessages);
            
            // Set initial session name and mark as generated if it exists
            if (data.sessionName && data.sessionName !== 'New Chat') {
              setSessionName(data.sessionName);
              setNameGenerated(true);
            }
          }
          setHistoryLoaded(true);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };

    loadHistory();
  }, [walletId, params?.sessionId, historyLoaded]);

  const handleChatSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const messageContent = input.trim();
    if (!messageContent) return;

    // Check if this is the first message
    const isFirstMessage = chatMessages.length === 0;
    console.log('Submitting message:', { messageContent, isFirstMessage });

    // Submit to chat directly
    if (isFirstMessage) {
      try {
        const body = {
          messages: [{ role: 'user' as const, content: messageContent }],
          isFirstMessage: true,
          model: selectedModel,
          sessionId: params.sessionId,
          conversationId: Date.now().toString()
        };
        console.log('Sending first message request:', body);

        const firstResponse = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${walletId}`
          },
          body: JSON.stringify(body)
        });

        if (!firstResponse.ok) {
          throw new Error('Failed to get first AI response');
        }

        const responseText = await firstResponse.text();
        console.log('Received first response:', responseText);

        // Add both messages to chat
        const newMessages = [
          { id: Date.now().toString(), content: messageContent, role: 'user' as const, createdAt: new Date() },
          { id: (Date.now() + 1).toString(), content: responseText, role: 'assistant' as const, createdAt: new Date() }
        ];
        console.log('Setting chat messages:', newMessages);
        setChatMessages(newMessages);
        
        // Clear input
        handleInputChange({ target: { value: '' } } as React.ChangeEvent<HTMLTextAreaElement>);

        // Reload chat history to get the saved messages
        // await loadInitialHistory();
      } catch (error) {
        console.error('Error getting first response:', error);
      }
    } else {
      handleSubmit(e);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col h-[calc(100vh-5rem)]">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-medium mb-4">Please connect your wallet to chat</h2>
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
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
              <Link href="/chat">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[#00FFD1]" />
                <h1 className="text-lg font-medium">
                  {sessionName || 'New Chat'}
                </h1>
              </div>
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
              <Link href="/chat">
                <Button variant="ghost" size="icon">
                  <Plus className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-5xl mx-auto space-y-6">
            {chatMessages && chatMessages.length > 0 ? (
              chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3 text-sm",
                    message.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="flex h-6 w-6 shrink-0 select-none items-center justify-center">
                      <Bot className="h-4 w-4 text-[#00FFD1]" />
                    </div>
                  )}
                  <div 
                    className={cn(
                      "rounded-lg px-3 py-2 max-w-[85%]",
                      message.role === 'user' 
                        ? "bg-[#00FFD1] text-black"
                        : "bg-white/5"
                    )}
                  >
                    {message.role === 'assistant' ? (
                      message.content ? (
                        <Markdown content={message.content} />
                      ) : (
                        <LoadingDots />
                      )
                    ) : (
                      message.content
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="flex h-6 w-6 shrink-0 select-none items-center justify-center">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                <Bot className="h-8 w-8 mb-4 text-[#00FFD1]" />
                <p className="text-lg font-medium">Start a conversation</p>
                <p className="text-sm">Send a message to begin chatting with the AI</p>
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="p-6 border-t border-gray-800/50">
          <div className="max-w-5xl mx-auto">
            <form onSubmit={handleChatSubmit} className="relative">
              <Input
                autoFocus
                value={input}
                onChange={handleInputChange}
                placeholder="Type your message..."
                className="w-full pl-6 pr-14 py-6 bg-gray-800/30 border-gray-700/50 focus-visible:ring-1 focus-visible:ring-[#00FFD1] placeholder:text-gray-500 rounded-2xl text-white"
              />
              <Button 
                type="submit"
                disabled={isLoading || !input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#00FFD1] hover:bg-[#00FFD1]/90 disabled:opacity-50 disabled:hover:bg-[#00FFD1] text-black rounded-xl p-2 h-auto transition-all"
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
                    className={cn(
                      "group px-4 py-3 hover:bg-gray-800/30 transition-all cursor-pointer",
                      session.sessionId === params.sessionId && "bg-gray-800/50"
                    )}
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
