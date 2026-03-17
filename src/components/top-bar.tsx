'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Heart, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useDeals } from '@/contexts/deals-context';

export function TopBar() {
  const [scrolled, setScrolled] = useState(false);
  const { favoriteDeals } = useDeals();
  const ticking = useRef(false);

  useEffect(() => {
    const handler = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 10);
        ticking.current = false;
      });
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50',
        'backdrop-blur-2xl border-b',
        'transition-[background-color,border-color,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]',
        scrolled
          ? 'bg-white/90 border-stone-200/50 shadow-[0_1px_2px_rgba(0,0,0,0.03)]'
          : 'bg-white/0 border-transparent shadow-none'
      )}
    >
      <div className="max-w-7xl mx-auto px-5 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <motion.div
            className="relative"
            whileTap={{ transform: 'scale(0.92)' }}
            animate={{
              transform: [
                'scale(1) rotate(0deg)',
                'scale(1) rotate(0deg)',
                'scale(1.08) rotate(-10deg)',
                'scale(0.96) rotate(12deg)',
                'scale(1.03) rotate(-4deg)',
                'scale(1) rotate(0deg)',
                'scale(1) rotate(0deg)',
                'scale(1) rotate(0deg)',
                'scale(1) rotate(0deg)',
                'scale(1) rotate(0deg)',
              ],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: [0.23, 1, 0.32, 1],
            }}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-stone-700 to-stone-900 flex items-center justify-center shadow-lg shadow-stone-800/25 group-hover:shadow-stone-800/40 transition-shadow ring-1 ring-white/10">
              <Tag className="w-[18px] h-[18px] text-white" strokeWidth={2.5} />
            </div>
            <motion.div
              className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border-[1.5px] border-white"
              animate={{ scale: [1, 1, 1, 1.4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>

          <div className="flex items-baseline">
            <span className="text-[22px] font-extrabold tracking-tight text-stone-900">
              DXB
            </span>
            <span className="text-[22px] font-extrabold tracking-tight text-stone-400">
              Save
            </span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-0.5">
          <Link
            href="/favorites"
            className="relative p-2.5 rounded-xl hover:bg-stone-100/80 transition-[transform,background-color] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-95"
            aria-label="View favorites"
          >
            <Heart className="w-[18px] h-[18px] text-stone-500" />
            {favoriteDeals.length > 0 && (
              <motion.span
                initial={{ transform: 'scale(0)' }}
                animate={{ transform: 'scale(1)' }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                className="absolute top-1 right-1 w-4 h-4 bg-gradient-to-br from-red-500 to-rose-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm"
              >
                {favoriteDeals.length > 9 ? '9+' : favoriteDeals.length}
              </motion.span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
