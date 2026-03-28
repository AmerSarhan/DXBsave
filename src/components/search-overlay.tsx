'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, ArrowLeft, TrendingUp, MapPin, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDeals } from '@/contexts/deals-context';
import { CATEGORIES } from '@/lib/constants';
import { AnyDeal } from '@/lib/types';
import { DealDetail } from './deal-detail';
import { DirhamIcon } from './dirham-icon';
import { createPortal } from 'react-dom';

const QUICK_SEARCHES = [
  'Free entry',
  'Brunch',
  'Pool day pass',
  'Happy hour',
  'Staycation',
  'Ladies night',
  'Deliveroo',
];

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
  onAskAI?: (query: string) => void;
}

function SearchResultCard({ deal, onTap }: { deal: AnyDeal; onTap: () => void }) {
  const config = CATEGORIES.find(c => c.key === deal.category);
  const isFree = deal.price?.toLowerCase().includes('free') || deal.offer?.toLowerCase().includes('free');

  return (
    <button
      onClick={onTap}
      className="w-full text-left flex items-center gap-3 p-3 rounded-xl active:bg-stone-100 active:scale-[0.97] transition-[transform,background-color] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] touch-manipulation"
    >
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', config?.bgColor || 'bg-stone-100')}>
        {config && <config.icon className={cn('w-4 h-4', config.color)} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-stone-800 truncate">{deal.name}</p>
        <p className="text-[11px] text-stone-400 flex items-center gap-0.5 mt-0.5">
          {(deal.location || deal.emirate) && (
            <>
              <MapPin className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">{[deal.location, deal.emirate].filter(Boolean).join(', ')}</span>
            </>
          )}
        </p>
        <p className="text-[12px] text-stone-500 truncate mt-0.5">{deal.offer}</p>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-1">
        {isFree ? (
          <span className="text-[13px] font-bold text-emerald-600">FREE</span>
        ) : deal.price ? (
          <span className="text-[14px] font-bold text-stone-900 inline-flex items-center gap-0.5">
            <DirhamIcon className="w-2.5 h-2.5 opacity-50" />
            {deal.price.replace(/[^0-9,+–-]/g, '').trim() || deal.price}
          </span>
        ) : null}
        <ChevronRight className="w-3.5 h-3.5 text-stone-300" />
      </div>
    </button>
  );
}

const AI_TRIGGERS = ['what', 'where', 'how', 'best', 'cheapest', 'recommend', 'suggest', 'find me', 'any', 'which', 'help'];

function isQuestion(q: string): boolean {
  const lower = q.toLowerCase().trim();
  if (lower.endsWith('?')) return true;
  return AI_TRIGGERS.some(t => lower.startsWith(t) || lower.includes(' ' + t + ' '));
}

export function SearchOverlay({ open, onClose, onAskAI }: SearchOverlayProps) {
  const { filters, setSearch, filteredDeals, allDeals, isTrending } = useDeals();
  const inputRef = useRef<HTMLInputElement>(null);
  const [localQuery, setLocalQuery] = useState('');
  const [selectedDeal, setSelectedDeal] = useState<AnyDeal | null>(null);

  useEffect(() => {
    if (open) {
      setLocalQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setLocalQuery('');
      setSearch('');
    }
    return () => { document.body.style.overflow = ''; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleChange = (val: string) => {
    setLocalQuery(val);
    setSearch(val);
  };

  const handleClose = () => {
    setSearch('');
    setLocalQuery('');
    onClose();
  };

  const handleDealTap = (deal: AnyDeal) => {
    setSelectedDeal(deal);
  };

  const searchResults = localQuery.trim() ? filteredDeals.slice(0, 30) : [];

  // Get trending deals for empty state
  const trendingDeals = allDeals.filter(d => isTrending(d.id)).slice(0, 6);
  // Fallback: if no trending data, show a mix of popular categories
  const spotlightDeals = trendingDeals.length > 0
    ? trendingDeals
    : [
        ...allDeals.filter(d => d.price?.toLowerCase().includes('free')).slice(0, 3),
        ...allDeals.filter(d => d.category === 'dining').slice(0, 3),
      ];

  const grouped = searchResults.reduce((acc, deal) => {
    if (!acc[deal.category]) acc[deal.category] = [];
    acc[deal.category].push(deal);
    return acc;
  }, {} as Record<string, typeof searchResults>);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 top-14 z-[45] bg-stone-50 flex flex-col">
        {/* Search header */}
        <div className="bg-white border-b border-stone-100 safe-top">
          <div className="flex items-center gap-2 px-3 py-2.5">
            <button
              onClick={handleClose}
              className="p-2 -ml-1 rounded-lg active:bg-stone-100 transition-colors touch-manipulation shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-stone-500" />
            </button>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={localQuery}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="Search deals..."
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="search"
                className="w-full pl-9 pr-3 py-2.5 bg-stone-100 rounded-xl text-[16px] outline-none placeholder:text-stone-400 text-stone-800 touch-manipulation"
              />
            </div>
            {localQuery && (
              <button
                onClick={() => handleChange('')}
                className="text-[13px] font-medium text-stone-500 active:text-stone-700 px-2 py-1 shrink-0 touch-manipulation"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* Empty state */}
          {!localQuery.trim() && (
            <div className="px-4 py-4">
              {/* Quick search chips */}
              <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2.5">
                Quick search
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {QUICK_SEARCHES.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleChange(term)}
                    className="text-[13px] px-3 py-2 rounded-xl bg-white text-stone-600 shadow-sm shadow-stone-100 active:bg-stone-100 active:scale-[0.97] transition-all touch-manipulation"
                  >
                    {term}
                  </button>
                ))}
              </div>

              {/* Trending / spotlight deals */}
              {spotlightDeals.length > 0 && (
                <>
                  <div className="flex items-center gap-1.5 mb-3">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                    <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                      {trendingDeals.length > 0 ? 'Trending now' : 'Popular deals'}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    {spotlightDeals.map((deal) => (
                      <SearchResultCard key={deal.id} deal={deal} onTap={() => handleDealTap(deal)} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* No results */}
          {localQuery.trim() && searchResults.length === 0 && (
            <div className="text-center py-16 px-4">
              <p className="text-[15px] font-medium text-stone-500 mb-1">No deals found</p>
              <p className="text-[13px] text-stone-400 mb-4">Try a different search term</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {QUICK_SEARCHES.slice(0, 4).map((term) => (
                  <button
                    key={term}
                    onClick={() => handleChange(term)}
                    className="text-[12px] px-3 py-1.5 rounded-lg bg-white text-stone-500 shadow-sm active:bg-stone-100 touch-manipulation"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* AI suggestion for question-like queries */}
          {localQuery.trim() && isQuestion(localQuery) && onAskAI && (
            <div className="px-4 pb-3">
              <button
                onClick={() => {
                  const q = localQuery;
                  onClose();
                  setTimeout(() => onAskAI(q), 100);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-stone-900 text-white active:scale-[0.98] transition-transform duration-[160ms] touch-manipulation"
              >
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Search className="w-4 h-4" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-[13px] font-semibold">Ask AI instead</p>
                  <p className="text-[11px] text-white/50 truncate">Get a smart answer for &ldquo;{localQuery}&rdquo;</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30 shrink-0" />
              </button>
            </div>
          )}

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="px-4 py-3">
              <p className="text-[11px] text-stone-400 mb-2">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
              </p>
              {Object.entries(grouped).map(([cat, deals]) => {
                const config = CATEGORIES.find(c => c.key === cat);
                return (
                  <div key={cat} className="mb-4">
                    <div className="flex items-center gap-1.5 mb-1 px-3">
                      {config && <config.icon className={cn('w-3 h-3', config.color)} />}
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                        {config?.label || cat}
                      </span>
                      <span className="text-[10px] text-stone-300">{deals.length}</span>
                    </div>
                    <div className="space-y-0.5">
                      {deals.map(deal => (
                        <SearchResultCard key={deal.id} deal={deal} onTap={() => handleDealTap(deal)} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Deal detail portal */}
      {selectedDeal && typeof document !== 'undefined' && createPortal(
        <DealDetail deal={selectedDeal} open={true} onClose={() => setSelectedDeal(null)} onChangeDeal={setSelectedDeal} />,
        document.body
      )}
    </>
  );
}
