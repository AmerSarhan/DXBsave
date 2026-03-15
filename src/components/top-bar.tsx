'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, Search, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useDeals } from '@/contexts/deals-context';
import { SearchOverlay } from './search-overlay';

export function TopBar() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { favoriteDeals } = useDeals();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          'backdrop-blur-2xl border-b',
          scrolled
            ? 'bg-white/90 border-neutral-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
            : 'bg-transparent border-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            {/* Price tag icon */}
            <motion.div
              whileHover={{ rotate: -12 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="relative"
            >
              <div className="w-9 h-9 rounded-xl bg-neutral-900 flex items-center justify-center shadow-lg shadow-neutral-900/20 group-hover:shadow-neutral-900/30 transition-shadow">
                <Tag className="w-[18px] h-[18px] text-white" strokeWidth={2.5} />
              </div>
              <motion.div
                className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border-[1.5px] border-white"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>

            {/* Text logo */}
            <div className="flex items-baseline">
              <span className="text-[22px] font-extrabold tracking-tight text-neutral-900">
                DXB
              </span>
              <span className="text-[22px] font-extrabold tracking-tight text-neutral-400">
                Save
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-0.5">
            <Link
              href="/favorites"
              className="relative p-2.5 rounded-xl hover:bg-neutral-100/80 transition-all active:scale-95"
              aria-label="View favorites"
            >
              <Heart className="w-[18px] h-[18px] text-neutral-500" />
              {favoriteDeals.length > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  className="absolute top-1 right-1 w-4 h-4 bg-gradient-to-br from-red-500 to-rose-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm"
                >
                  {favoriteDeals.length > 9 ? '9+' : favoriteDeals.length}
                </motion.span>
              )}
            </Link>
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2.5 rounded-xl hover:bg-neutral-100/80 transition-all active:scale-95"
              aria-label="Search deals"
            >
              <Search className="w-[18px] h-[18px] text-neutral-500" />
            </button>
          </div>
        </div>
      </header>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
