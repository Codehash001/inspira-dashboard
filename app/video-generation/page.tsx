'use client';

import { useEffect, useRef, useState } from 'react';
import { Wand2, Download, Loader2, Sparkles, XCircle, ChevronDown, AlertCircle } from 'lucide-react';
import { useWallet } from '@/lib/use-wallet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast, useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Footer from "@/components/footer";
import { ToastAction } from "@/components/ui/toast";
import { cn } from "@/lib/utils" 
import { useVideoGenerationStore } from '@/store/video-generation-store';
import { useRouter } from 'next/navigation';

interface GeneratedVideo {
  videoId: string;
  videoUrl: string | null;
  prompt?: string;
  creditUsed?: number;  
  generatedAt?: string;
}

interface PreviousVideo extends GeneratedVideo {
  createdAt: string;
  status: string; // 'pending', 'processing', 'completed', 'failed'
  error?: string | null;
  resolution?: string | null;
  model?: string;
}

interface DisplayVideo extends GeneratedVideo {
  isLoading?: boolean;
  hasError?: boolean;
  status?: string;
  error?: string | null;
}

// Helper function to determine video type
const isPreviousVideo = (video: DisplayVideo): video is PreviousVideo => {
  return 'createdAt' in video;
};

// Helper function to safely get video URL, ensuring it's never null when used
const getVideoUrl = (video: DisplayVideo): string => {
  return video.videoUrl || '';
};

// Video player component
const VideoPlayer: React.FC<{ video: DisplayVideo }> = ({ video }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setIsVideoReady(false);
  }, [video]);

  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
    setIsVideoReady(false);
  };

  const handleLoadedData = () => {
    setIsLoading(false);
    setHasError(false);
    setIsVideoReady(true);
  };

  const handleCanPlay = () => {
    setIsLoading(false);
    setHasError(false);
    setIsVideoReady(true);
  };

  const handleError = () => {
    if (!isVideoReady) {
      setIsLoading(false);
      setHasError(true);
    }
  };

  const handleDownload = async () => {
    const videoUrl = getVideoUrl(video);
    if (!videoUrl) {
      toast({
        title: 'Error',
        description: 'Video is not available for download.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Create an initial toast notification with loading state
      const { dismiss } = toast({
        title: 'Downloading Video',
        description: 'Your video is being prepared for download...',
        duration: Infinity,
      });

      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `video-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Dismiss the loading toast
      dismiss();
      
      // Show success toast
      toast({
        title: 'Download Complete',
        description: 'Your video has been downloaded successfully.',
        duration: 3000,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download Failed',
        description: 'Unable to download the video. Please try again later.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
      <video
        ref={videoRef}
        controls
        playsInline
        preload="metadata"
        onLoadStart={handleLoadStart}
        onLoadedData={handleLoadedData}
        onCanPlay={handleCanPlay}
        onError={handleError}
        className={cn(
          "w-full h-full object-contain",
          !isVideoReady && "opacity-0"
        )}
      >
        {video.videoUrl && <source src={video.videoUrl} type="video/mp4" />}
        {video.videoUrl && <source src={video.videoUrl} type="video/webm" />}
        {video.videoUrl && <source src={video.videoUrl} type="video/ogg" />}
        Your browser does not support the video tag.
      </video>

      {/* Loading Spinner */}
      {isLoading && !isVideoReady && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Only show error if video failed to load and is not ready */}
      {hasError && !isVideoReady && (
        <div className="absolute inset-0 flex items-center justify-center text-destructive">
          <div className="text-center">
            <XCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load video. Please try again later.</p>
          </div>
        </div>
      )}

      {/* Download Button */}
      <div className="mt-4">
        <Button
          onClick={handleDownload}
          variant="outline"
          className="w-full"
          disabled={!isVideoReady || !video.videoUrl}
        >
          <Download className="mr-2 h-4 w-4" />
          Download Video
        </Button>
      </div>
    </div>
  );
};

export default function VideoGenerationPage() {
  const { address, isConnected } = useWallet();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPrevious, setLoadingPrevious] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previousVideos, setPreviousVideos] = useState<PreviousVideo[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<DisplayVideo | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  
  // Get video generation state from store
  const { 
    isGenerating, 
    videoId, 
    error: storeError,
    setGenerating, 
    setError: setStoreError,
    reset: resetGenerationState
  } = useVideoGenerationStore();

  // Check on mount if we have an error state
  useEffect(() => {
    if (storeError) {
      // If there's already an error in the store on component mount, show it
      toast({
        title: 'Video Generation Failed',
        description: 'Failed to generate video. Please try again later.',
        variant: 'destructive',
        duration: 5000,
      });
    }
  }, []);

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement> | React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!prompt || !address) {
      setError(!address ? 'Please connect your wallet first' : 'Please enter a prompt');
      return;
    }

    // Clear any previous errors first
    resetGenerationState();
    setLoading(true);
    setError(null);

    // Update global store to indicate video is generating
    setGenerating(true, 'pending', prompt);

    // Show initial toast notification
    toast({
      title: 'Video Generation Started',
      description: 'Your video generation request has been submitted. You can navigate away from this page and will be notified when it completes.',
      variant: 'default',
      duration: 5000,
    });

    try {
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, walletId: address }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error('Failed to generate video');
      }

      // Update the store with the actual video ID
      setGenerating(true, data.videoId, prompt);

      // Show success toast
      toast({
        title: 'Video Being Generated',
        description: 'Your video is now being generated. You will be notified when it is ready.',
        variant: 'default',
        duration: 5000,
      });

      // Clear prompt field after successful submission
      setPrompt('');

      // Refresh the videos list to show the new pending video
      fetchPreviousVideos(1);

    } catch (err) {
      console.error('Error:', err);
      
      // Make sure isGenerating is definitely set to false
      setGenerating(false);
      
      // Update error in global store
      setStoreError('Failed to generate video. Please try again later.');
      
      // Show error toast
      toast({
        title: 'Video Generation Failed',
        description: 'Failed to generate video. Please try again later.',
        variant: 'destructive',
        duration: 5000,
      });
      
      setError('Failed to generate video. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch previous videos
  const fetchPreviousVideos = async (pageToFetch = 1, append = false) => {
    try {
      setLoadingPrevious(true);
      const response = await fetch(`/api/videos?walletId=${address}&page=${pageToFetch}&limit=6`);
      const data = await response.json();
      
      // Debug the status values in the console
      console.log("Fetched videos with statuses:", data.videos.map((v: { videoId: string; status: any; videoUrl: any; }) => ({ 
        id: v.videoId.substring(0, 8), 
        status: v.status,
        hasUrl: !!v.videoUrl
      })));
      
      if (data.videos) {
        // Make sure status is a string to avoid type errors
        const processedVideos = data.videos.map((v: { status: any; }) => ({
          ...v,
          status: String(v.status || '').toLowerCase()
        }));
        
        if (append) {
          setPreviousVideos(prev => [...prev, ...processedVideos]);
        } else {
          setPreviousVideos(processedVideos);
        }
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error('Error fetching previous videos:', error);
    } finally {
      setLoadingPrevious(false);
    }
  };

  // Fetch videos when address changes
  useEffect(() => {
    if (address) {
      fetchPreviousVideos(1);
    }
  }, [address]);

  // Poll for video status updates
  useEffect(() => {
    // Don't poll if there's an error
    if (!videoId || videoId === 'pending' || !isGenerating || storeError) return;
    
    const checkVideoStatus = async () => {
      try {
        const res = await fetch(`/api/video-status?videoId=${videoId}`);
        
        if (!res.ok) {
          throw new Error('Failed to check video status');
        }
        
        const data = await res.json();
        
        if (data.status === 'completed') {
          // Video is ready - notify user
          toast({
            title: 'Video Generation Complete',
            description: 'Your video has been generated successfully!',
            variant: 'default',
            action: (
              <ToastAction altText="View Video" onClick={() => router.push('/video-generation')}>
                View Video
              </ToastAction>
            ),
            duration: 10000,
          });
          
          // Reset generation state
          resetGenerationState();
          
          // Refresh the videos list
          fetchPreviousVideos(1);
        } else if (data.status === 'failed') {
          // Video generation failed
          toast({
            title: 'Video Generation Failed',
            description: 'Failed to generate video. Please try again later.',
            variant: 'destructive',
            duration: 5000,
          });
          
          // Make sure isGenerating is definitely set to false
          setGenerating(false);
          
          // Reset generation state with error
          setStoreError('Failed to generate video. Please try again later.');
        }
      } catch (error) {
        console.error('Error checking video status:', error);
        
        // If we can't check status after multiple attempts, assume something went wrong
        setStoreError('Failed to generate video. Please try again later.');
      }
    };
    
    // Check status every 10 seconds
    const interval = setInterval(checkVideoStatus, 10000);
    
    return () => clearInterval(interval);
  }, [videoId, isGenerating, storeError, toast, resetGenerationState, setStoreError, router, fetchPreviousVideos]);

  const handleLoadMore = () => {
    if (!loadingPrevious && hasMore) {
      setPage(prev => prev + 1);
      fetchPreviousVideos(page + 1, true);
    }
  };

  // Track which videos failed to load
  const [failedVideos, setFailedVideos] = useState<Record<string, boolean>>({});

  // Handle video load error
  const handleVideoError = (videoId: string, e: React.SyntheticEvent<HTMLVideoElement>) => {
    console.error(`Failed to load video ${videoId}:`, e);
    e.currentTarget.style.display = "none";
    
    // Mark this video as failed
    setFailedVideos(prev => ({
      ...prev,
      [videoId]: true
    }));
  };

  // Handle video load success
  const handleVideoLoad = (videoId: string) => {
    // If previously marked as failed, remove that status
    if (failedVideos[videoId]) {
      setFailedVideos(prev => {
        const updated = { ...prev };
        delete updated[videoId];
        return updated;
      });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
          Video Generation
        </h1>
        <p className="text-muted-foreground text-lg mt-2">
          Transform your ideas into stunning videos with our AI-powered video generator
        </p>
      </div>

      {/* If there's an error in the store, show an error banner */}
      {storeError && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-8 flex items-center space-x-4">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <div>
            <h3 className="font-medium text-destructive">Video Generation Failed</h3>
            <p className="text-sm text-muted-foreground">
              Failed to generate video. Please try again later.
            </p>
            <Button 
              variant="link" 
              onClick={resetGenerationState} 
              className="p-0 h-auto mt-1 text-sm underline"
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* If video is currently generating and no error, show status banner */}
      {isGenerating && !storeError && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-8 flex items-center space-x-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div>
            <h3 className="font-medium">Video Generation in Progress</h3>
            <p className="text-sm text-muted-foreground">
              {prompt ? `"${prompt.substring(0, 60)}${prompt.length > 60 ? '...' : ''}"` : 'Your video is being generated'}
            </p>
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="bg-card border rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Create a New Video</h2>
        <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="prompt" className="text-sm font-medium">
              Video Description
            </label>
            <Textarea
              id="prompt"
              placeholder="Describe your video in detail... Be specific about scenes, colors, mood, and style."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[150px] resize-none p-2"
              disabled={loading || (isGenerating && !storeError)}
            />
            <p className="text-xs text-muted-foreground">
              The more detailed your description, the better the results will be.
            </p>
          </div>
          
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          
          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              disabled={loading || !isConnected || (isGenerating && !storeError)}
              className="md:w-auto w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Video...
                </>
              ) : isGenerating && !storeError ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Video Generation in Progress
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate Video
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Previous Videos Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Previous Videos</h2>
        
        {/* Show loading state while fetching videos */}
        {loadingPrevious && previousVideos.length === 0 && (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}
        
        {/* Show message when no videos are available */}
        {!loadingPrevious && previousVideos.length === 0 && (
          <div className="text-center p-8 border rounded-lg bg-muted/5">
            <p className="text-muted-foreground">You haven't generated any videos yet.</p>
          </div>
        )}
        
        {/* Video grid */}
        {previousVideos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {previousVideos.map((video) => (
              <div 
                key={video.videoId} 
                className="border rounded-lg overflow-hidden bg-muted/5 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedVideo(video)}
              >
                {/* Video Thumbnail */}
                <div className="relative aspect-video bg-muted">
                  {/* Default display the video for completed status or if it has a URL */}
                  {((video.status === 'completed' || video.videoUrl) && !failedVideos[video.videoId]) && (
                    <video
                      className="w-full h-full object-cover"
                      poster="/video-thumbnail-placeholder.jpg"
                      preload="metadata"
                      onError={(e) => handleVideoError(video.videoId, e)}
                      onLoadedData={() => handleVideoLoad(video.videoId)}
                    >
                      <source src={`${getVideoUrl(video)}#t=0.5`} type="video/mp4" />
                    </video>
                  )}
                  
                  {/* Failed to load overlay - only show if video failed to load */}
                  {(failedVideos[video.videoId] || 
                    video.status === 'failed' || 
                    (!video.videoUrl && video.status === 'completed')) && (
                    <div className="absolute inset-0 flex items-center justify-center text-destructive">
                      <div className="text-center">
                        <XCircle className="h-8 w-8 mx-auto mb-2" />
                        <p>Failed to load video. Please try again later.</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Pending overlay - only show for pending or processing status */}
                  {(video.status === 'pending' || video.status === 'processing') && !video.videoUrl && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
                        <p>Processing video...</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Video info */}
                <div className="p-4">
                  <p className="truncate font-medium">
                    {video.prompt || "Untitled video"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(video.createdAt).toLocaleDateString()}
                  </p>
                  {/* Add status debugging - REMOVE IN PRODUCTION */}
                  <p className="text-xs text-muted-foreground mt-1">
                    Status: {video.status || 'unknown'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Load more button */}
        {hasMore && previousVideos.length > 0 && (
          <div className="my-8 flex justify-center">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              disabled={loadingPrevious}
              className="w-40"
            >
              {loadingPrevious ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <ChevronDown className="mr-2 h-4 w-4" />
                  Load More
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Video Preview Dialog */}
      <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedVideo?.prompt || "Video Preview"}
            </DialogTitle>
          </DialogHeader>
          
          {selectedVideo && (
            <VideoPlayer video={selectedVideo} />
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
