'use client';

import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullRefreshProps {
  pullDistance: number;
  refreshing: boolean;
  pulling: boolean;
}

export function PullRefreshIndicator({ pullDistance, refreshing, pulling }: PullRefreshProps) {
  if (!pulling && !refreshing) return null;

  const progress = Math.min(pullDistance / 60, 1);

  return (
    <div
      className="fixed top-14 left-0 right-0 z-30 flex justify-center pointer-events-none"
      style={{ transform: `translateY(${pullDistance}px)` }}
    >
      <div className={cn(
        'w-9 h-9 rounded-full bg-white shadow-lg shadow-stone-200/50 flex items-center justify-center transition-transform duration-200',
        refreshing && 'animate-spin'
      )}>
        <RefreshCw
          className="w-4 h-4 text-stone-500"
          style={{ opacity: progress, transform: `rotate(${progress * 180}deg)` }}
        />
      </div>
    </div>
  );
}
