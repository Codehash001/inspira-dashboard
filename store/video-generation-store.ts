import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface VideoGenerationState {
  isGenerating: boolean;
  videoId: string | null;
  prompt: string | null;
  startedAt: string | null;
  error: string | null;
  setGenerating: (isGenerating: boolean, videoId?: string | null, prompt?: string | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useVideoGenerationStore = create<VideoGenerationState>()(
  persist(
    (set) => ({
      isGenerating: false,
      videoId: null,
      prompt: null,
      startedAt: null,
      error: null,
      setGenerating: (isGenerating, videoId = null, prompt = null) => 
        set({
          isGenerating,
          videoId,
          prompt,
          startedAt: isGenerating ? new Date().toISOString() : null,
          error: null,
        }),
      setError: (error) => set({ error, isGenerating: false, videoId: null }),
      reset: () => set({ 
        isGenerating: false,
        videoId: null,
        prompt: null,
        startedAt: null,
        error: null 
      }),
    }),
    {
      name: 'video-generation-store',
    }
  )
);
