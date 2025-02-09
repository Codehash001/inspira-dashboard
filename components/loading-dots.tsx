import { cn } from '@/lib/utils';

export function LoadingDots() {
  return (
    <div className="flex items-center space-x-1">
      <span>AI is thinking</span>
      <span className="inline-flex animate-[loading_1.4s_ease-in-out_infinite]">.</span>
      <span className="inline-flex animate-[loading_1.4s_ease-in-out_0.2s_infinite]">.</span>
      <span className="inline-flex animate-[loading_1.4s_ease-in-out_0.4s_infinite]">.</span>
    </div>
  );
}
