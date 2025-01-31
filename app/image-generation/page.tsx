'use client';

import { useState } from 'react';
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Settings2, Loader2, Download } from "lucide-react";

interface ImageSettings {
  size: string;
  style: string;
  numberOfImages: number;
}

const defaultSettings: ImageSettings = {
  size: "1024x1024",
  style: "vivid",
  numberOfImages: 1,
};

export default function GenerateImagePage() {
  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<ImageSettings>(defaultSettings);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, ...settings }),
      });

      const data = await response.json();

      if (response.ok) {
        setImages(prev => [...prev, data.imageUrl]);
      } else {
        setError(data.error || 'An error occurred while generating the image.');
      }
    } catch (err) {
      setError('An error occurred while generating the image.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generated-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export image.');
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Base Background Color */}
      <div className="fixed inset-0 " />
      
      {/* Animated Gradient Background */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-70"
        style={{
          background: `radial-gradient(circle at 50% 50%, 
            rgba(32, 244, 204, 0.08) 0%, 
            rgba(0, 24, 49, 0.08) 50%, 
            transparent 70%
          )`,
          filter: 'blur(120px)',
          transform: 'translate3d(0, 0, 0)',
          animation: 'moveGradient 30s alternate infinite'
        }}
      />
      <div 
        className="fixed inset-0 pointer-events-none opacity-70"
        style={{
          background: `radial-gradient(circle at 50% 50%, 
            rgba(32, 196, 244, 0.08) 0%, 
            rgba(0, 49, 49, 0.08) 50%, 
            transparent 70%
          )`,
          filter: 'blur(120px)',
          transform: 'translate3d(0, 0, 0)',
          animation: 'moveGradient2 30s alternate infinite'
        }}
      />
      
      {/* Grid Pattern */}
      <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-20" />

      <style jsx>{`
        @keyframes moveGradient {
          0% {
            transform: translate3d(-30%, -30%, 0) scale(1.5);
          }
          50% {
            transform: translate3d(0%, 0%, 0) scale(1);
          }
          100% {
            transform: translate3d(30%, 30%, 0) scale(1.5);
          }
        }
        @keyframes moveGradient2 {
          0% {
            transform: translate3d(30%, 30%, 0) scale(1.5);
          }
          50% {
            transform: translate3d(0%, 0%, 0) scale(1);
          }
          100% {
            transform: translate3d(-30%, -30%, 0) scale(1.5);
          }
        }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 backdrop-blur-xl z-10 py-6 border-b border-[hsl(var(--theme-fg))]/10">
        <div className="container mx-auto px-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-[#20F4CC] to-[#20C4F4]">
            AI Image Generation
          </h1>
          <p className="text-sm md:text-base text-[hsl(var(--theme-fg))]/60 mb-6">
            Transform your ideas into stunning visuals with our AI-powered image generator
          </p>
          <form onSubmit={handleSubmit} className="flex gap-4 max-w-4xl">
            <div className="flex-grow relative">
              <Input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A cute children sheltering under the leaves when it rains..."
                className="w-full h-12 glass-card border-0 text-base pr-12 placeholder:text-[hsl(var(--theme-fg))]/50"
              />
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-[hsl(var(--theme-fg))]/10"
                  >
                    <Settings2 className="h-4 w-4 text-[hsl(var(--theme-fg))]" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] glass-card border-[hsl(var(--theme-fg))]/20">
                  <DialogHeader>
                    <DialogTitle className="text-[hsl(var(--theme-fg))]">Generation Settings</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    <div className="space-y-2">
                      <Label className="text-[hsl(var(--theme-fg))]/70">Image Size</Label>
                      <Select
                        value={settings.size}
                        onValueChange={(value) => setSettings({ ...settings, size: value })}
                      >
                        <SelectTrigger className="glass-card border-[hsl(var(--theme-fg))]/20 text-[hsl(var(--theme-fg))]">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent className="glass-card border-[hsl(var(--theme-fg))]/20">
                          <SelectItem value="256x256">Small (256x256)</SelectItem>
                          <SelectItem value="512x512">Medium (512x512)</SelectItem>
                          <SelectItem value="1024x1024">Large (1024x1024)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[hsl(var(--theme-fg))]/70">Style</Label>
                      <Select
                        value={settings.style}
                        onValueChange={(value) => setSettings({ ...settings, style: value })}
                      >
                        <SelectTrigger className="glass-card border-[hsl(var(--theme-fg))]/20 text-[hsl(var(--theme-fg))]">
                          <SelectValue placeholder="Select style" />
                        </SelectTrigger>
                        <SelectContent className="glass-card border-[hsl(var(--theme-fg))]/20">
                          <SelectItem value="vivid">✨ Vivid</SelectItem>
                          <SelectItem value="natural">🌿 Natural</SelectItem>
                          <SelectItem value="artistic">🎨 Artistic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <Label className="text-[hsl(var(--theme-fg))]/70">Number of Images</Label>
                        <span className="text-sm text-[hsl(var(--theme-fg))]/70">{settings.numberOfImages}</span>
                      </div>
                      <Slider
                        value={[settings.numberOfImages]}
                        onValueChange={([value]) => setSettings({ ...settings, numberOfImages: value })}
                        min={1}
                        max={4}
                        step={1}
                        className="[&>span]:bg-[#20F4CC]"
                      />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Button 
              type="submit"
              className="h-12 px-8 bg-gradient-to-r from-[#20F4CC] to-[#20C4F4] hover:opacity-90 text-black font-medium"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Generate'
              )}
            </Button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {error && (
          <div className="mb-8 px-4 py-3 glass-card border border-red-500/20 text-red-400 text-sm rounded-lg">
            {error}
          </div>
        )}

        {images.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {images.map((imageUrl, index) => {
              // Determine if this image should span multiple columns
              const isLarge = index % 3 === 0;
              return (
                <div 
                  key={index}
                  className={`relative group glass-card rounded-3xl overflow-hidden shadow-lg hover:shadow-[#20F4CC]/20 transition-all duration-300
                    ${isLarge ? 'col-span-1 md:col-span-2 row-span-2' : ''}`}
                >
                  <div className="aspect-square w-full h-full">
                    <Image
                      src={imageUrl}
                      alt={`Generated image ${index + 1}`}
                      width={800}
                      height={800}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:text-[#20F4CC] hover:bg-white/10"
                      onClick={() => handleExport(imageUrl)}
                    >
                      <Download className="h-6 w-6" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-[60vh]  rounded-3xl flex items-center justify-center text-[hsl(var(--theme-fg))]/60">
            Your generated images will appear here
          </div>
        )}
      </main>
    </div>
  );
}
