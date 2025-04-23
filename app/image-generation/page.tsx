'use client';

import { useEffect, useState } from 'react';
import { Wand2, Download, Loader2, Sparkles, ChevronDown, X } from 'lucide-react';
import { useWallet } from '@/lib/use-wallet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Cloudinary } from '@cloudinary/url-gen';
import { format } from '@cloudinary/url-gen/actions/delivery';
import { scale } from '@cloudinary/url-gen/actions/resize';
import { AdvancedImage } from '@cloudinary/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageDetailsModal } from '@/components/image-details-modal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Footer from "@/components/footer";

// Initialize Cloudinary
const cld = new Cloudinary({
  cloud: {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  }
});

type DallE3Size = '1024x1024' | '1024x1792';
type DallE2Size = '256x256' | '512x512' | '1024x1024';
type ModelType = 'DALL-E-2' | 'DALL-E-3';

const DALLE2_SIZES: DallE2Size[] = ['256x256', '512x512', '1024x1024'];
const DALLE3_SIZES: DallE3Size[] = ['1024x1024', '1024x1792'];

interface ImageSettings {
  model: ModelType;
  size: DallE2Size | DallE3Size;
  n?: number;
}

interface GeneratedImage {
  url: string;
  publicId: string;
  size: string;

  prompt?: string;
}

interface PreviousImage {
  imageId: string;
  imageUrl: string;
  resolution: string;

  prompt?: string;
  createdAt: string;
  creditUsed: number;
  tokenUsed: number;
}

type DisplayImage = GeneratedImage | PreviousImage;

// Helper function to determine image type
const isPreviousImage = (image: DisplayImage): image is PreviousImage => {
  return 'imageId' in image;
};

const getImageUrl = (image: DisplayImage): string => {
  return isPreviousImage(image) ? image.imageUrl : image.url;
};

const getImageSize = (image: DisplayImage): string => {
  return isPreviousImage(image) ? image.resolution : image.size;
};

const getImagePublicId = (image: DisplayImage): string => {
  const url = getImageUrl(image);
  return url.split('/').pop()?.split('.')[0] || '';
};

export default function GenerateImagePage() {
  const { address } = useWallet();
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [previousImages, setPreviousImages] = useState<PreviousImage[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedImage, setSelectedImage] = useState<DisplayImage | null>(null);
  const [settings, setSettings] = useState<ImageSettings>({
    model: 'DALL-E-3',
    size: '1024x1024',
    n: 1,
  });

  const handleDownload = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generated-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading image:', error);
      toast({
        title: 'Error',
        description: 'Failed to download image',
        variant: 'destructive',
      });
    }
  };

  // Fetch previous images
  const fetchPreviousImages = async (pageNum: number, append = false) => {
    if (!address) return;

    try {
      setLoadingMore(true);
      const res = await fetch(`/api/images?walletId=${address}&page=${pageNum}&limit=10`);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      setPreviousImages(prev => append ? [...prev, ...data.images] : data.images);
      setHasMore(data.hasMore);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load previous images',
        variant: 'destructive',
      });
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (address) {
      fetchPreviousImages(1);
    }
  }, [address]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPreviousImages(nextPage, true);
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
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          ...settings,
          walletId: address,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      // Transform the image data to match the expected format
      const formattedImages = data.images.map((img: any) => ({
        url: img.imageUrl || img.url,
        publicId: img.publicId || (img.imageUrl || img.url).split('/').pop()?.split('.')[0],
        size: settings.size,

        prompt: prompt
      }));

      // Update the generated images immediately
      setImages(formattedImages);

      // Convert generated images to PreviousImage format and add to previousImages
      const newPreviousImages = formattedImages.map((img: { publicId: any; url: any; size: any; prompt: any; }) => ({
        imageId: img.publicId,
        imageUrl: img.url,
        resolution: img.size,

        prompt: img.prompt,
        createdAt: new Date().toISOString(),
        creditUsed: data.creditUsed || 0,
        tokenUsed: data.tokenUsed || 0
      }));

      // Update previousImages state with new images at the beginning
      setPreviousImages(prev => [...newPreviousImages, ...prev]);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate image',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <div className="flex-1">
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
                  Image Generation
                </h1>
                <p className="text-muted-foreground text-lg">
                  Transform your ideas into stunning visuals with our AI-powered image generator
                </p>
              </motion.div>

              <motion.form 
                onSubmit={handleSubmit} 
                className="space-y-6 p-6 rounded-xl border bg-card/50 backdrop-blur-sm"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="space-y-4">
                  <div className="grid gap-6 sm:grid-cols-3">
                    <motion.div 
                      className="space-y-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Label className="text-base">Model</Label>
                      <Select
                        value={settings.model}
                        onValueChange={(value: ModelType) => {
                          const newSettings: ImageSettings = {
                            model: value,
                            size: value === "DALL-E-2" ? "1024x1024" : "1024x1024",
                            n: 1,
                          };
                          setSettings(newSettings);
                        }}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DALL-E-2">Standard</SelectItem>
                          <SelectItem value="DALL-E-3">HD</SelectItem>
                        </SelectContent>
                      </Select>
                    </motion.div>

                    <motion.div 
                      className="space-y-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Label className="text-base">Size</Label>
                      <Select
                        value={settings.size}
                        onValueChange={(value: DallE2Size | DallE3Size) => setSettings({ ...settings, size: value })}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          {(settings.model === "DALL-E-2" ? DALLE2_SIZES : DALLE3_SIZES).map((size) => (
                            <SelectItem key={size} value={size}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </motion.div>


                  </div>

                  <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Label className="text-base">Prompt</Label>
                    <div className="relative">
                      <Textarea
                        placeholder="Enter your prompt here..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={4}
                        className="resize-none pr-12 bg-background/50 backdrop-blur-sm"
                      />
                      <Sparkles className="absolute right-4 top-4 text-primary/40" />
                    </div>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <Button 
                    type="submit" 
                    disabled={loading || !prompt || prompt.length === 0} 
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

            {/* Right Column - Generated Images */}
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="grid gap-6">
                <AnimatePresence>
                  {images.map((image, index) => {
                    const imageUrl = getImageUrl(image);
                    if (!imageUrl) return null;

                    return (
                      <motion.div
                        key={index}
                        className="relative aspect-square w-full max-w-md rounded-xl overflow-hidden bg-muted/20 group"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.3 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setSelectedImage(image)}
                      >
                        <img
                          src={imageUrl}
                          alt={`Generated ${index + 1}`}
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-between p-4">
                          <div className="text-white">
                            <p className="text-sm font-medium">{getImageSize(image)}</p>

                          </div>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(imageUrl);
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          {/* Previous Images Bento Grid */}
          <motion.div 
            className="mt-16 space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <h2 className="text-2xl font-semibold">Previous Creations</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[200px]">
              <AnimatePresence>
                {previousImages.map((image, index) => {
                  const [width, height] = image.resolution.split('x').map(Number);
                  const isWide = width > height;
                  const isTall = height > width;
                  const isLarge = index % 5 === 0;

                  const gridClass = `
                    ${isLarge ? 'col-span-2 row-span-2' : ''}
                    ${!isLarge && isWide ? 'col-span-2' : ''}
                    ${!isLarge && isTall ? 'row-span-2' : ''}
                  `;

                  return (
                    <motion.div
                      key={image.imageId}
                      className={`relative group rounded-xl overflow-hidden cursor-pointer bg-muted/20 ${gridClass}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.5 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedImage(image)}
                    >
                      <img
                        src={image.imageUrl}
                        alt={`Generated ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-between p-4">
                        <div className="text-white">
                          <p className="text-sm font-medium">{image.resolution}</p>

                        </div>
                      </div>
                    </motion.div>
                  );
                })}
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
                      <ChevronDown className="mr-2 h-5 w-5" />
                      Load More
                    </motion.div>
                  )}
                </Button>
              </div>
            )}
          </motion.div>
        </div>

        {/* Image Modal */}
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <DialogTitle className="text-xl font-semibold">Image Details</DialogTitle>
              </div>

              {selectedImage && (
                <div className="grid grid-cols-1 lg:grid-cols-2 h-[calc(90vh-8rem)] overflow-hidden">
                  {/* Image Container */}
                  <div className="w-full relative md:h-full h-[300px] bg-muted/5 border-b lg:border-b-0 ">
                    <div className="absolute inset-0 p-4 rounded-lg">
                      <img
                        src={getImageUrl(selectedImage)}
                        alt="Selected image"
                        className="w-full h-full object-contain rounded-lg"
                      />
                    </div>
                  </div>
                  
                  {/* Details Container */}
                  <div className="p-4 overflow-y-auto">
                    <div className="space-y-6">
                      {/* Prompt */}
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Prompt</h3>
                        <p className="text-sm break-words">
                          {selectedImage.prompt || 'No prompt available'}
                        </p>
                      </div>
                      
                      {/* Image Information */}
                      <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Resolution</h3>
                          <p className="text-sm mt-1">{getImageSize(selectedImage)}</p>
                        </div>
                        

                        
                        {isPreviousImage(selectedImage) && (
                          <>
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground">Credits Used</h3>
                              <p className="text-sm mt-1">{selectedImage.creditUsed.toFixed(3)}</p>
                            </div>
                            
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                              <p className="text-sm mt-1">
                                {new Date(selectedImage.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Download Button */}
                      <Button
                        onClick={() => handleDownload(getImageUrl(selectedImage))}
                        className="w-full gap-2"
                        variant="secondary"
                      >
                        <Download className="h-4 w-4" />
                        Download Original
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

      </div>

      <Footer />
    </div>
  );
}
