'use client';

import { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDeals } from '@/contexts/deals-context';
import { CATEGORIES } from '@/lib/constants';
import { DealCard } from './deal-card';

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const { filters, setSearch, filteredDeals, clearFilters } = useDeals();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const searchResults = filters.search.trim()
    ? filteredDeals.slice(0, 20)
    : [];

  // Group by category
  const grouped = searchResults.reduce((acc, deal) => {
    if (!acc[deal.category]) acc[deal.category] = [];
    acc[deal.category].push(deal);
    return acc;
  }, {} as Record<string, typeof searchResults>);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] bg-white/95 backdrop-blur-2xl"
        >
          <div className="max-w-2xl mx-auto px-4 pt-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={filters.search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search hotels, restaurants, deals..."
                  className="w-full pl-12 pr-4 py-3.5 bg-neutral-100 rounded-2xl text-base outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                />
              </div>
              <button
                onClick={() => {
                  setSearch('');
                  onClose();
                }}
                className="p-2.5 rounded-full hover:bg-neutral-100 transition-colors"
                aria-label="Close search"
              >
                <X className="w-5 h-5 text-neutral-600" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(100vh-100px)] pb-8">
              {filters.search.trim() === '' && (
                <div className="text-center py-16 text-neutral-400">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Search across all deals</p>
                  <p className="text-sm mt-1">Hotels, restaurants, attractions, and more</p>
                </div>
              )}

              {filters.search.trim() !== '' && searchResults.length === 0 && (
                <div className="text-center py-16 text-neutral-400">
                  <p className="text-lg font-medium">No deals found</p>
                  <p className="text-sm mt-1">Try a different search term</p>
                  <button
                    onClick={() => { clearFilters(); }}
                    className="mt-4 text-sm text-blue-600 hover:underline"
                  >
                    Clear search
                  </button>
                </div>
              )}

              {Object.entries(grouped).map(([cat, deals]) => {
                const config = CATEGORIES.find(c => c.key === cat);
                return (
                  <div key={cat} className="mb-6">
                    <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      {config && <config.icon className="w-4 h-4" />}
                      {config?.label || cat}
                      <span className="text-neutral-300">({deals.length})</span>
                    </h3>
                    <div className="space-y-3">
                      {deals.map(deal => (
                        <DealCard key={deal.id} deal={deal} compact onDetailOpen={onClose} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
