'use client';

import { useEffect, useState } from 'react';
import { Wand2, Download, Loader2, Sparkles } from 'lucide-react';
import { useWallet } from '@/lib/use-wallet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface GeneratedVideo {
  videoUrl: string;
  videoId: string;
  prompt?: string;
}

interface PreviousVideo {
  videoId: string;
  videoUrl: string;
  prompt?: string;
  createdAt: string;
  creditUsed: number;
  tokenUsed: number;
}

type DisplayVideo = GeneratedVideo | PreviousVideo;

// Helper function to determine video type
const isPreviousVideo = (video: DisplayVideo): video is PreviousVideo => {
  return 'createdAt' in video;
};

const getVideoUrl = (video: DisplayVideo): string => {
  return isPreviousVideo(video) ? video.videoUrl : video.videoUrl;
};

export default function VideoGenerationPage() {
  const { address } = useWallet();
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [videos, setVideos] = useState<GeneratedVideo[]>([]);
  const [previousVideos, setPreviousVideos] = useState<PreviousVideo[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<DisplayVideo | null>(null);

  const handleDownload = async (videoUrl: string) => {
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generated-video-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading video:', error);
      toast({
        title: 'Error',
        description: 'Failed to download video',
        variant: 'destructive',
      });
    }
  };

  // Fetch previous videos
  const fetchPreviousVideos = async (pageNum: number, append = false) => {
    if (!address) return;

    try {
      setLoadingMore(true);
      const res = await fetch(`/api/videos?walletId=${address}&page=${pageNum}&limit=10`);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      setPreviousVideos(prev => append ? [...prev, ...data.videos] : data.videos);
      setHasMore(data.hasMore);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load previous videos',
        variant: 'destructive',
      });
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (address) {
      fetchPreviousVideos(1);
    }
  }, [address]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPreviousVideos(nextPage, true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt || !address) {
      toast({
        title: 'Error',
        description: !address ? 'Please connect your wallet first' : 'Please enter a prompt',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      toast({
        title: 'Generating Video',
        description: 'This may take several minutes. Please wait...',
      });

      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          walletId: address,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setVideos(data.videos);

      // Convert generated videos to PreviousVideo format and add to previousVideos
      const newPreviousVideos = data.videos.map((video: GeneratedVideo) => ({
        videoId: video.videoId,
        videoUrl: video.videoUrl,
        prompt: video.prompt,
        createdAt: new Date().toISOString(),
        creditUsed: data.creditUsed || 0,
        tokenUsed: data.tokenUsed || 0,
      }));

      setPreviousVideos(prev => [...newPreviousVideos, ...prev]);
      setPrompt('');

      toast({
        title: 'Success',
        description: 'Video generated successfully!',
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate video',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <div className="container mx-auto py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column - Form */}
          <div className="space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
                Video Generation
              </h1>
              <p className="text-muted-foreground text-lg">
                Transform your ideas into stunning videos with our AI-powered video generator
              </p>
            </motion.div>

            <motion.form 
              onSubmit={handleSubmit} 
              className="space-y-6 p-6 rounded-xl border bg-card/50 backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="relative">
                  <Textarea
                    placeholder="Describe your video idea... (e.g., On a distant planet, there is a MiniMax)"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    className="resize-none pr-12 bg-background/50 backdrop-blur-sm"
                  />
                  <Sparkles className="absolute right-4 top-4 text-primary/40" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button 
                  type="submit" 
                  disabled={loading || !prompt} 
                  className="w-full h-12 text-lg font-medium"
                >
                  {loading ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center space-x-2"
                    >
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Generating...</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center space-x-2"
                    >
                      <Wand2 className="h-4 w-4" />
                      <span>Generate</span>
                    </motion.div>
                  )}
                </Button>
              </motion.div>
            </motion.form>
          </div>

          {/* Right Column - Generated Videos */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-2xl font-semibold">Generated Videos</h2>
            <div className="grid gap-6">
              <AnimatePresence>
                {videos.map((video, index) => (
                  <motion.div
                    key={index}
                    className="relative aspect-video w-full rounded-xl overflow-hidden bg-muted/20 group"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedVideo(video)}
                  >
                    <video
                      src={video.videoUrl}
                      className="w-full h-full object-cover"
                      controls
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-between p-4">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(video.videoUrl);
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Previous Videos Grid */}
        <motion.div 
          className="mt-16 space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <h2 className="text-2xl font-semibold">Previous Creations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {previousVideos.map((video) => (
                <motion.div
                  key={video.videoId}
                  className="relative aspect-video rounded-xl overflow-hidden cursor-pointer bg-muted/20"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.5 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedVideo(video)}
                >
                  <video
                    src={video.videoUrl}
                    className="w-full h-full object-cover"
                    controls
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {hasMore && (
            <div className="flex justify-center pt-8">
              <Button
                variant="outline"
                size="lg"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="min-w-[200px]"
              >
                {loadingMore ? (
                  <motion.div
                    className="flex items-center"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Loading...
                  </motion.div>
                ) : (
                  <motion.div
                    className="flex items-center"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Load More
                  </motion.div>
                )}
              </Button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Video Modal */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="sm:max-w-[800px] p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="text-xl font-semibold">Video Details</DialogTitle>
          </DialogHeader>
          {selectedVideo && (
            <div className="space-y-4">
              <div className="relative w-full aspect-video bg-muted/10">
                <video
                  src={getVideoUrl(selectedVideo)}
                  className="w-full h-full"
                  controls
                  autoPlay
                />
              </div>
              <div className="px-6 pb-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium">Prompt</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedVideo.prompt || 'No prompt available'}
                    </p>
                  </div>
                  {isPreviousVideo(selectedVideo) && (
                    <>
                      <div className="space-y-1">
                        <h3 className="text-sm font-medium">Created</h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedVideo.createdAt}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-medium">Credits Used</h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedVideo.creditUsed}
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={() => handleDownload(getVideoUrl(selectedVideo))}
                    className="flex items-center space-x-2"
                    variant="secondary"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Original</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
