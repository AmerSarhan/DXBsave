'use client';

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
  { value: 'price-low', label: 'Price: Low' },
  { value: 'expiring-soon', label: 'Expiring Soon' },
];

export function CategoryBar() {
  const { filters, setEmirate, setSort } = useDeals();

  return (
    <div className="sticky top-14 z-40 bg-stone-50 border-b border-stone-200/40 will-change-transform">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-2">
        <div className="flex-1 flex gap-1.5 overflow-x-auto no-scrollbar min-w-0">
          {EMIRATES.map((emirate) => (
            <button
              key={emirate}
              onClick={() => setEmirate(emirate)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-[transform,background-color,color] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] shrink-0 active:scale-95',
                filters.emirate === emirate
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-400 hover:text-stone-600'
              )}
            >
              {emirate}
            </button>
          ))}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-stone-400 whitespace-nowrap outline-none shrink-0">
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
  );
}
