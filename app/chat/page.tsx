'use client';

import { useChat } from 'ai/react';
import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Send, 
  Image as ImageIcon,
  Bot,
  User,
  Loader2,
  Plus,
} from 'lucide-react';

export default function Page() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append('files', file);
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className=" px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1F1F1F]">
              <Bot className="h-5 w-5 text-[#00FFD1]" />
            </div>
            <h1 className="text-lg font-medium text-white">AI Chat</h1>
          </div>
          <Button 
            variant="ghost"
            className="text-[#00FFD1] hover:text-[#00FFD1] hover:bg-[#1F1F1F] gap-2"
            onClick={() => window.location.reload()}
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-lg bg-[#1F1F1F] mb-4">
                  <Bot className="h-6 w-6 text-[#00FFD1]" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">
                  Hello! How can I assist you today?
                </h3>
              </div>
            </div>
          ) : (
            <div className="py-6 space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "px-6",
                    message.role === 'user' ? "flex justify-end" : "flex justify-start"
                  )}
                >
                  <div className={cn(
                    "flex items-center gap-3 max-w-[80%] rounded-lg p-3",
                    message.role === 'user' 
                      ? "text-[#00FFD1] flex-row-reverse" 
                      : "text-white"
                  )}>
                    <div className={cn(
                      "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg",
                      message.role === 'user'
                        ? "bg-[#1F1F1F]"
                        : "bg-[#1F1F1F]"
                    )}>
                      {message.role === 'user' 
                        ? <User className="h-4 w-4" />
                        : <Bot className="h-4 w-4 text-[#00FFD1]" />
                      }
                    </div>
                    <div className="text-sm leading-relaxed">
                      {message.content}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t  p-6">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <input
              name="prompt"
              value={input}
              onChange={handleInputChange}
              placeholder="Message..."
              className="w-full rounded-lg border-none px-4 py-3 text-white placeholder:text-[#808080] focus:outline-none focus:ring-1 focus:ring-[#00FFD1]"
            />
            <label 
              htmlFor="file-upload" 
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer p-2 text-[#808080] hover:text-white transition-colors"
            >
              <ImageIcon className="h-5 w-5" />
            </label>
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="bg-[#00FFD1] text-black hover:bg-[#00FFD1]/90 px-4 py-3 h-auto rounded-lg"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
