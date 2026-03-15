'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useDeals } from '@/contexts/deals-context';
import { CATEGORIES } from '@/lib/constants';
import { CategoryKey } from '@/lib/types';

export function CategoryBar() {
  const { filters, setCategory, getCategoryCount } = useDeals();

  const handleSelect = (key: CategoryKey | 'all') => {
    setCategory(key);
  };

  return (
    <div className="sticky top-14 z-40 bg-white/80 backdrop-blur-2xl border-b border-neutral-100/80">
      <div className="relative max-w-7xl mx-auto">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white/90 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/90 to-transparent z-10 pointer-events-none" />

        <div className="px-5 py-2.5 flex gap-2 overflow-x-auto no-scrollbar">
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => handleSelect('all')}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold whitespace-nowrap transition-all shrink-0',
              filters.category === 'all'
                ? 'bg-gradient-to-r from-neutral-900 to-neutral-700 text-white shadow-lg shadow-neutral-900/15'
                : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700'
            )}
          >
            All Deals
          </motion.button>

          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const count = getCategoryCount(cat.key);
            const isActive = filters.category === cat.key;
            return (
              <motion.button
                key={cat.key}
                whileTap={{ scale: 0.93 }}
                onClick={() => handleSelect(cat.key)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold whitespace-nowrap transition-all shrink-0',
                  isActive
                    ? 'bg-gradient-to-r from-neutral-900 to-neutral-700 text-white shadow-lg shadow-neutral-900/15'
                    : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
                {count > 0 && (
                  <span className={cn(
                    'text-[11px] font-bold tabular-nums',
                    isActive ? 'text-white/60' : 'text-neutral-400'
                  )}>
                    {count}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
