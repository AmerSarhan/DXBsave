'use client';

import { motion } from 'framer-motion';
import { ArrowDownUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDeals } from '@/contexts/deals-context';
import { EMIRATES } from '@/lib/constants';
import { SortOption } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'expiring-soon', label: 'Expiring Soon' },
];

export function FilterBar() {
  const { filters, setEmirate, setSort } = useDeals();

  return (
    <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
      <div className="relative flex-1 min-w-0">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {EMIRATES.map((emirate) => (
            <motion.button
              key={emirate}
              whileTap={{ scale: 0.95 }}
              onClick={() => setEmirate(emirate)}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border shrink-0',
                filters.emirate === emirate
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-md shadow-neutral-900/15'
                  : 'bg-white text-neutral-500 border-neutral-200 hover:border-neutral-300'
              )}
            >
              {emirate}
            </motion.button>
          ))}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-neutral-200 hover:border-neutral-300 text-neutral-600 whitespace-nowrap transition-all outline-none shrink-0">
            <ArrowDownUp className="w-3.5 h-3.5" />
            {SORT_OPTIONS.find(o => o.value === filters.sort)?.label || 'Sort'}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {SORT_OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setSort(option.value)}
              className={cn(
                'text-sm cursor-pointer',
                filters.sort === option.value && 'font-semibold text-blue-600'
              )}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
