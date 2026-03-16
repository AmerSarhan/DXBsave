'use client';

import { motion } from 'framer-motion';
import { ArrowDownUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDeals } from '@/contexts/deals-context';
import { CATEGORIES, EMIRATES } from '@/lib/constants';
import { CategoryKey, SortOption } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'price-low', label: 'Price: Low' },
  { value: 'expiring-soon', label: 'Expiring Soon' },
];

export function CategoryBar() {
  const { filters, setCategory, getCategoryCount, setEmirate, setSort } = useDeals();

  return (
    <div className="sticky top-14 z-40 bg-stone-50/90 backdrop-blur-2xl border-b border-stone-200/40">
      <div className="max-w-7xl mx-auto">
        {/* Categories row */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-stone-50/90 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-stone-50/90 to-transparent z-10 pointer-events-none" />
          <div className="px-4 py-2 flex gap-1.5 overflow-x-auto no-scrollbar">
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => setCategory('all')}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-all shrink-0',
                filters.category === 'all'
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100'
              )}
            >
              All
            </motion.button>
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const count = getCategoryCount(cat.key);
              const isActive = filters.category === cat.key;
              return (
                <motion.button
                  key={cat.key}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setCategory(cat.key)}
                  className={cn(
                    'flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-all shrink-0',
                    isActive
                      ? 'bg-stone-900 text-white shadow-sm'
                      : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100'
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {cat.label}
                  {count > 0 && (
                    <span className={cn('text-[10px]', isActive ? 'text-white/50' : 'text-stone-400')}>
                      {count}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Emirates + Sort row */}
        <div className="px-4 pb-2 flex items-center gap-2">
          <div className="flex-1 flex gap-1 overflow-x-auto no-scrollbar min-w-0">
            {EMIRATES.map((emirate) => (
              <button
                key={emirate}
                onClick={() => setEmirate(emirate)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-all shrink-0',
                  filters.emirate === emirate
                    ? 'bg-stone-800 text-white'
                    : 'text-stone-400 hover:text-stone-600'
                )}
              >
                {emirate}
              </button>
            ))}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-stone-400 hover:text-stone-600 whitespace-nowrap transition-all outline-none shrink-0">
              <ArrowDownUp className="w-3 h-3" />
              {SORT_OPTIONS.find(o => o.value === filters.sort)?.label || 'Sort'}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {SORT_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setSort(option.value)}
                  className={cn(
                    'text-sm cursor-pointer',
                    filters.sort === option.value && 'font-semibold'
                  )}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
