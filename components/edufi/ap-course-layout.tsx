"use client"

import { useState, useEffect, useRef, ReactNode } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Send, Mic, MicOff, Volume2, VolumeX, Play } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Define prop types for our AP course layout
interface APCourseLayoutProps {
  title: string;
  description: string;
  agentId: string;
  avatarImage?: string;
  children?: ReactNode;
}

// Create the layout component that will be dynamically imported
function APCourseLayoutContent({
  title,
  description,
  agentId,
  avatarImage = "/images/tutor-avatar.png"
}: APCourseLayoutProps) {
  // Import the SDK only on the client side
  const sdk = require('@d-id/client-sdk');
  
  const { toast } = useToast()
  const [message, setMessage] = useState("")
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string; id: string; audioUrl?: string }[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const agentManagerRef = useRef<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const srcObjectRef = useRef<MediaStream | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  
  // D-ID Agent configuration
  const clientKey = "Z29vZ2xlLW9hdXRoMnwxMTgxMjQ3MjYwOTQ5OTkxNTA4OTQ6VGFvaE40Y21EQ1ZlU2kwSDJVU0pN"

  // Function to ensure audio is enabled
  const ensureAudioEnabled = () => {
    if (videoRef.current) {
      videoRef.current.muted = false
      videoRef.current.volume = 1.0
      setIsMuted(false)
      console.log("Audio enabled with volume:", videoRef.current.volume)
      
      // Try to play the video to ensure audio works
      videoRef.current.play().catch(e => {
        console.error("Error playing video:", e)
      })
    }
  }

  useEffect(() => {
    // Add event listener for user interaction to enable audio
    const handleUserInteraction = () => {
      ensureAudioEnabled()
      // Remove the event listeners after first interaction
      document.removeEventListener('click', handleUserInteraction)
      document.removeEventListener('touchstart', handleUserInteraction)
    }
    
    document.addEventListener('click', handleUserInteraction)
    document.addEventListener('touchstart', handleUserInteraction)
    
    return () => {
      document.removeEventListener('click', handleUserInteraction)
      document.removeEventListener('touchstart', handleUserInteraction)
    }
  }, [])

  useEffect(() => {
    // Check if we're running in the browser
    if (typeof window === 'undefined') return;
    
    const initializeAgent = async () => {
      try {
        setLoading(true)
        
        // Define callback functions for the D-ID SDK
        const callbacks = {
          onSrcObjectReady: (value: MediaStream | null) => {
            console.log("Source object ready:", value ? "MediaStream received" : "No MediaStream")
            srcObjectRef.current = value
            
            if (videoRef.current && value) {
              videoRef.current.srcObject = value
              videoRef.current.muted = false
              videoRef.current.volume = 1.0
              
              // Try to play the video to ensure it starts
              videoRef.current.play().catch(e => {
                console.error("Error playing video after setting srcObject:", e)
              })
              
              console.log("Video element updated with MediaStream, unmuted with volume set to 1.0")
              return value
            }
            return null
          },
          onVideoStateChange: (state: string) => {
            console.log("Video state changed:", state)
            if (state === "STOP" && videoRef.current && agentManagerRef.current) {
              videoRef.current.srcObject = null
              videoRef.current.src = agentManagerRef.current.agent.presenter.idle_video
            } else if (videoRef.current) {
              videoRef.current.src = ""
              videoRef.current.srcObject = srcObjectRef.current
            }
          },
          onConnectionStateChange: (state: string) => {
            console.log("Connection state changed:", state)
            if (state === "connected") {
              setConnected(true)
              setLoading(false)
              
              // Send a welcome message
              setTimeout(async () => {
                try {
                  console.log("Attempting to speak welcome message")
                  if (agentManagerRef.current) {
                    await agentManagerRef.current.speak({
                      type: "text",
                      input: "Welcome to your AP course! I'm your virtual tutor. How can I help you with your studies today?"
                    })
                    console.log("Welcome message sent successfully")
                  }
                } catch (error) {
                  console.error("Error sending welcome message:", error)
                }
              }, 2000)
            } else if (state === "disconnected" || state === "closed" || state === "fail") {
              setConnected(false)
            }
          },
          onNewMessage: (messages: any[], type: string) => {
            console.log("New message:", messages, type)
            if (type === "answer" && messages.length > 0) {
              // Get the last message from the agent
              const lastMessage = messages[messages.length - 1]
              
              // Check if this is a new message (not already in history)
              if (!lastMessage.id || !chatHistory.some(msg => msg.id === lastMessage.id)) {
                // Replace all existing assistant messages with this one to avoid duplicates
                setChatHistory(prevHistory => {
                  // Keep only user messages
                  const userMessages = prevHistory.filter(msg => msg.role === 'user')
                  
                  // Add the new assistant message
                  return [...userMessages, {
                    role: lastMessage.role,
                    content: lastMessage.content,
                    id: lastMessage.id || `assistant-${Date.now()}`
                  }]
                })
              }
              setIsProcessing(false)
            }
          },
          onError: (error: any, errorData: any) => {
            console.error("D-ID SDK Error:", error, errorData)
            toast({
              title: "Connection Error",
              description: "Failed to connect to the tutor. Please try refreshing the page.",
              variant: "destructive"
            })
            setLoading(false)
          }
        }
        
        try {
          // Create agent manager
          const auth = { type: 'key' as const, clientKey }
          const agentManager = await sdk.createAgentManager(agentId, { 
            auth, 
            callbacks,
            // Required mode property
            mode: 'normal' as any, // Using 'as any' to bypass type checking temporarily
            // Optional stream options
            streamOptions: {
              compatibilityMode: "auto",
              streamWarmup: true,
              outputResolution: 720
            }
          })
          agentManagerRef.current = agentManager
          
          console.log("Connecting to agent...")
          // Connect to the agent
          await agentManager.connect()
          console.log("Connected to agent successfully")
          
          // Add initial system message to chat history
          setChatHistory([
            {
              role: "assistant",
              content: "Welcome to your AP course! I'm your virtual tutor. How can I help you with your studies today?",
              id: "welcome-message"
            }
          ])
          
        } catch (error) {
          console.error("Error during agent initialization:", error)
          toast({
            title: "Connection Error",
            description: "Failed to connect to the tutor. Please try refreshing the page.",
            variant: "destructive"
          })
          setLoading(false)
        }
      } catch (error) {
        console.error("Error in initializeAgent:", error)
        toast({
          title: "Initialization Error",
          description: "Failed to initialize the tutor. Please try refreshing the page.",
          variant: "destructive"
        })
        setLoading(false)
      }
    }
    
    // Initialize the agent when the component mounts
    initializeAgent()
    
    // Clean up function to disconnect the agent when the component unmounts
    return () => {
      if (agentManagerRef.current) {
        try {
          agentManagerRef.current.disconnect()
          console.log("Agent disconnected")
        } catch (error) {
          console.error("Error disconnecting agent:", error)
        }
      }
      
      // Stop any ongoing recording
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop()
      }
      
      // Clear the video source
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }, [agentId, toast])
  
  // Scroll to the bottom of the chat when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatHistory])
  
  const handleSendMessage = async () => {
    if (!message.trim() || !connected || isProcessing) return
    
    try {
      setIsProcessing(true)
      
      // Add user message to chat history
      setChatHistory(prev => [...prev, {
        role: "user",
        content: message,
        id: `user-${Date.now()}`
      }])
      
      // Store the message to send
      const messageToSend = message
      
      // Clear input field immediately for better UX
      setMessage("")
      
      console.log("Sending message to agent:", messageToSend)
      
      // Send message using the SDK
      if (agentManagerRef.current) {
        try {
          // First try the chat method
          await agentManagerRef.current.chat(messageToSend)
        } catch (chatError) {
          console.error("Error with chat method, trying speak instead:", chatError)
          // Fallback to speak method
          await agentManagerRef.current.speak({
            type: "text",
            input: messageToSend
          })
        }
      } else {
        console.error('Agent manager not found')
        setIsProcessing(false)
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      })
      setIsProcessing(false)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      const newMutedState = !isMuted
      videoRef.current.muted = newMutedState
      setIsMuted(newMutedState)
      
      // Show toast notification
      toast({
        title: newMutedState ? "Audio Muted" : "Audio Unmuted",
        description: newMutedState ? "Tutor audio is now muted" : "Tutor audio is now unmuted",
        variant: "default"
      })
    }
  }

  const startRecording = async () => {
    // Check if we're running in the browser
    if (typeof window === 'undefined') return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        const audioUrl = URL.createObjectURL(audioBlob)
        
        // Add user message placeholder with audio URL
        setChatHistory(prev => [...prev, {
          role: "user",
          content: "🎤 Voice message",
          id: `voice-${Date.now()}`,
          audioUrl: audioUrl
        }])
        
        setIsProcessing(true)
        
        try {
          if (agentManagerRef.current) {
            try {
              // Try to use the audio directly with the agent
              await agentManagerRef.current.speak({
                type: "audio",
                audio_url: audioUrl
              })
            } catch (audioError) {
              console.error("Error processing audio, falling back to text:", audioError)
              // Fallback to text message
              await agentManagerRef.current.chat("I sent a voice message asking about this course")
            }
          } else {
            console.error('Agent manager not found')
            toast({
              title: "Connection Error",
              description: "Cannot communicate with the virtual tutor. Please refresh the page.",
              variant: "destructive"
            })
            setIsProcessing(false)
          }
          
          // Do not revoke the URL here to allow playback
        } catch (error) {
          console.error("Error processing voice message:", error)
          toast({
            title: "Error",
            description: "Failed to process voice message. Please try again.",
            variant: "destructive"
          })
          setIsProcessing(false)
        }
        
        // Clean up
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorderRef.current.start()
      setIsRecording(true)
      
      toast({
        title: "Recording Started",
        description: "Speak clearly into your microphone.",
      })
    } catch (error) {
      console.error("Error starting recording:", error)
      toast({
        title: "Microphone Error",
        description: "Could not access your microphone. Please check permissions.",
        variant: "destructive"
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      // Show toast notification
      toast({
        title: "Recording Stopped",
        description: "Processing your voice message...",
        variant: "default"
      })
    }
  }

  const playVoiceMessage = (audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.src = audioUrl
      audioRef.current.play().catch(error => {
        console.error("Error playing voice message:", error)
        toast({
          title: "Playback Error",
          description: "Could not play the voice message. Please try again.",
          variant: "destructive"
        })
      })
    } else {
      console.error("Audio element not found")
      toast({
        title: "Playback Error",
        description: "Audio player not available. Please refresh the page.",
        variant: "destructive"
      })
    }
  }
  

  return (
    <div className="container mx-auto py-2 h-[100dvh] flex flex-col overflow-hidden">
      <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-2 md:mb-4 px-1">{title}</h1>
      
      {/* Hidden audio element for voice message playback */}
      <audio ref={audioRef} style={{ display: 'none' }} />
      
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4 lg:gap-6 overflow-hidden">
        {/* Left column - Resources and Chat */}
        <div className="lg:col-span-7 order-2 lg:order-1 flex flex-col overflow-hidden h-[350px] sm:h-[400px] md:h-[500px] lg:h-auto">
          <Tabs defaultValue="chat" className="flex flex-col h-full">
            <TabsContent value="chat" className="flex-1 overflow-hidden">
              <Card className="flex flex-col h-full border-0">
                <CardHeader className="pb-1 md:pb-2 px-2 sm:px-4 lg:px-6">
                  <CardTitle className="text-base md:text-lg">Chat with Your Tutor</CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    {description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="flex-1 overflow-y-auto pt-1 md:pt-2 px-2 sm:px-4 lg:px-6">
                  <div className="space-y-2 md:space-y-4">
                    {chatHistory.map((msg) => (
                      <div 
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[85%] rounded-lg px-2 py-1.5 sm:px-3 md:px-4 md:py-2 text-xs sm:text-sm md:text-base ${
                            msg.role === 'user' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted'
                          } flex items-center`}
                        >
                          {msg.audioUrl ? (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => playVoiceMessage(msg.audioUrl!)}
                                className="mr-2 p-0 h-6 w-6"
                              >
                                <Play className="h-3 w-3" />
                              </Button>
                              {msg.content}
                            </>
                          ) : (
                            msg.content
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </CardContent>
                
                <CardFooter className="border-t pt-2 md:pt-3 px-2 sm:px-4 lg:px-6">
                  <div className="flex w-full items-center gap-1 md:gap-2">
                    <div className="relative flex-grow">
                      <Textarea
                        placeholder="Ask a question..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSendMessage()
                          }
                        }}
                        className="pr-12 md:pr-16 min-h-[40px] md:min-h-[50px] text-sm md:text-base"
                        disabled={!connected || isProcessing}
                        style={{ paddingRight: '60px', resize: 'none', maxHeight: '100px' }}
                      />
                      <div className="absolute right-1 sm:right-1.5 md:right-2 bottom-1 sm:bottom-1.5 md:bottom-2 flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={toggleMute}
                          disabled={!connected}
                          className="h-6 w-6 md:h-8 md:w-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                          title="Toggle audio"
                        >
                          {isMuted ? <VolumeX className="h-3 w-3 md:h-4 md:w-4" /> : <Volume2 className="h-3 w-3 md:h-4 md:w-4"/>}
                        </Button>
                        
                        <Button
                          variant={isRecording ? "destructive" : "ghost"}
                          size="icon"
                          onClick={isRecording ? stopRecording : startRecording}
                          disabled={!connected || isProcessing}
                          className="h-6 w-6 md:h-8 md:w-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                          title="Toggle microphone"
                        >
                          {isRecording ? <MicOff className="h-3 w-3 md:h-4 md:w-4" /> : <Mic className="h-3 w-3 md:h-4 md:w-4" />}
                        </Button>
                      </div>
                    </div>
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!message.trim() || !connected || isProcessing}
                      className="rounded-full h-8 w-8 md:h-10 md:w-10 p-0 flex items-center justify-center bg-primary hover:bg-primary/90"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 md:h-5 md:w-5" />
                      )}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Right column - D-ID Agent */}
        <div className="lg:col-span-5 order-1 lg:order-2 flex flex-col items-center justify-start h-[250px] sm:h-[300px] md:h-[350px] lg:h-[90%] mb-3 lg:mb-0">
          <div className="relative w-full max-w-[240px] xs:max-w-[280px] sm:max-w-xs md:max-w-sm lg:max-w-md mx-auto bg-black rounded-lg overflow-hidden shadow-xl h-full">
            {/* Tutor avatar image - shown before video loads */}
            <div className="absolute inset-0 flex items-center justify-center z-0">
              <img 
                src={avatarImage} 
                alt="Tutor Avatar" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback if image doesn't exist
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary" />
                <span className="ml-2 text-white text-sm md:text-base">Connecting...</span>
              </div>
            )}
            
            <video 
              ref={videoRef}
              autoPlay 
              playsInline
              muted={false}
              className="w-full h-full object-cover z-5 relative"
              onLoadedMetadata={() => {
                console.log("Video metadata loaded")
                if (videoRef.current) {
                  videoRef.current.muted = false
                  videoRef.current.volume = 1.0
                  console.log("Video element ready, unmuted with volume set to 1.0")
                }
              }}
            />
            
            {/* Controls overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-1 md:p-2 bg-gradient-to-t from-black/70 to-transparent flex justify-center items-center z-20">
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  disabled={!connected}
                  className="h-8 w-8 md:h-auto md:w-auto text-white hover:bg-white/20 p-1 md:p-2"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  <span className="hidden md:inline ml-1 text-xs">{isMuted ? "Unmute" : "Mute"}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Use dynamic import with no SSR to prevent the component from loading during server-side rendering
const ClientOnlyAPCourseLayout = dynamic(() => Promise.resolve(APCourseLayoutContent), {
  ssr: false,
});

// Export the layout component
export default function APCourseLayout(props: APCourseLayoutProps) {
  return <ClientOnlyAPCourseLayout {...props} />;
}
