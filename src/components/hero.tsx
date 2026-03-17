'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Search, Flame, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDeals } from '@/contexts/deals-context';
import { CategoryKey, AnyDeal } from '@/lib/types';
import { DirhamIcon } from './dirham-icon';
import { DealDetail } from './deal-detail';
import { createPortal } from 'react-dom';

const CATEGORY_IMAGES: { key: CategoryKey; label: string; image: string }[] = [
  { key: 'hotels', label: 'Hotels', image: '/category/Hotels.png' },
  { key: 'dining', label: 'Dining', image: '/category/Dining.png' },
  { key: 'attractions', label: 'Attractions', image: '/category/Attractions.png' },
  { key: 'delivery', label: 'Delivery', image: '/category/Delivery.png' },
  { key: 'spa', label: 'Spa', image: '/category/Spa.png' },
  { key: 'shopping', label: 'Shopping', image: '/category/shopping.png' },
  { key: 'eid', label: 'Eid', image: '/category/Eid.png' },
];

export function Hero() {
  const { setCategory, getCategoryCount, setSearch, allDeals, filters } = useDeals();
  const [promoIndex, setPromoIndex] = useState(0);
  const [openDeal, setOpenDeal] = useState<AnyDeal | null>(null);

  const promoDeals = allDeals.filter(d =>
    d.price?.toLowerCase().includes('free') || d.isExpiringSoon
  ).slice(0, 5);

  useEffect(() => {
    if (promoDeals.length <= 1) return;
    const interval = setInterval(() => {
      setPromoIndex(prev => (prev + 1) % promoDeals.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [promoDeals.length]);

  const promoDeal = promoDeals[promoIndex];

  return (
    <section className="pt-16 pb-2 bg-gradient-to-b from-amber-50/40 via-stone-50 to-stone-50">
      <div className="max-w-7xl mx-auto px-4">

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-stone-300 pointer-events-none" />
          <input
            type="text"
            defaultValue={filters.search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="What are you looking for?"
            className="w-full pl-11 pr-4 py-3.5 bg-white rounded-2xl text-[16px] outline-none ring-1 ring-stone-100 placeholder:text-stone-300 text-stone-800 focus:ring-stone-300 transition-[box-shadow] duration-200"
          />
        </div>

        {/* Categories — big, scrollable, visual */}
        <div className="relative mb-5">
          <div className="absolute right-0 top-0 bottom-6 w-10 bg-gradient-to-l from-stone-50 to-transparent z-10 pointer-events-none" />

          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1" style={{ WebkitOverflowScrolling: 'touch' }}>
            {/* All button */}
            <button
              onClick={() => setCategory('all')}
              className={cn(
                'flex flex-col items-center shrink-0 active:scale-[0.93] transition-[transform,opacity] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
                filters.category !== 'all' && 'opacity-50'
              )}
            >
              <div className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-[20px] mb-1.5 flex items-center justify-center transition-all duration-200 ${
                filters.category === 'all'
                  ? 'bg-stone-900 shadow-xl shadow-stone-900/25'
                  : 'bg-white shadow-md shadow-stone-200/40'
              }`}>
                <span className={`text-[22px] sm:text-[26px] font-black ${
                  filters.category === 'all' ? 'text-white' : 'text-stone-800'
                }`}>All</span>
                <span className={`absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-[9px] font-bold ${
                  filters.category === 'all'
                    ? 'bg-white text-stone-900'
                    : 'bg-stone-900 text-white'
                }`}>
                  {allDeals.length}
                </span>
              </div>
              <span className={`text-[12px] font-semibold ${
                filters.category === 'all' ? 'text-stone-900' : 'text-stone-500'
              }`}>
                All Deals
              </span>
            </button>

            {CATEGORY_IMAGES.map((cat, i) => {
              const count = getCategoryCount(cat.key);
              const isActive = filters.category === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setCategory(isActive ? 'all' : cat.key)}
                  className={cn(
                    'relative flex flex-col items-center shrink-0 active:scale-[0.93] transition-[transform,opacity] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
                    filters.category !== 'all' && !isActive && 'opacity-50'
                  )}
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-[20px] mb-1.5 overflow-hidden transition-all duration-200 ${
                    isActive
                      ? 'bg-stone-900 shadow-xl shadow-stone-900/25 scale-[1.02]'
                      : 'bg-white shadow-md shadow-stone-200/40'
                  }`}>
                    <Image
                      src={cat.image}
                      alt={cat.label}
                      fill
                      className="object-cover scale-125"
                      sizes="96px"
                      priority={i < 4}
                    />
                    {count > 0 && (
                      <span className={`absolute top-1 right-1 z-10 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-[9px] font-bold ${
                        isActive
                          ? 'bg-white text-stone-900'
                          : 'bg-stone-900 text-white'
                      }`}>
                        {count}
                      </span>
                    )}
                  </div>
                  <span className={`text-[12px] font-semibold ${
                    isActive ? 'text-stone-900' : 'text-stone-500'
                  }`}>
                    {cat.label}
                  </span>
                </button>
              );
            })}
            <div className="shrink-0 w-6" aria-hidden="true" />
          </div>
        </div>

        {/* Featured deal banner */}
        {promoDeal && (
          <button
            onClick={() => setOpenDeal(promoDeal)}
            className="w-full text-left mb-4 rounded-2xl overflow-hidden relative active:scale-[0.98] transition-transform duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
          >
            <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 p-4 pb-3">
              {/* Top label */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                  Featured Deal
                </span>
                {promoDeal.isExpiringSoon && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400">
                    <Flame className="w-3 h-3" />
                    Ending soon
                  </span>
                )}
              </div>

              {/* Deal info */}
              <div className="flex items-end justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[16px] font-bold text-white leading-snug mb-0.5 line-clamp-1">{promoDeal.name}</p>
                  <p className="text-[12px] text-white/50 line-clamp-1">{promoDeal.offer}</p>
                  {(promoDeal.location || promoDeal.emirate) && (
                    <p className="text-[10px] text-white/30 mt-1 flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5" />
                      {[promoDeal.location, promoDeal.emirate].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  {promoDeal.price?.toLowerCase().includes('free') ? (
                    <span className="text-[22px] font-black text-emerald-400 leading-none">FREE</span>
                  ) : promoDeal.price ? (
                    <span className="text-[22px] font-black text-white leading-none inline-flex items-center gap-0.5">
                      <DirhamIcon className="w-4 h-4 opacity-50" />
                      {promoDeal.price.replace(/[^0-9,]/g, '').trim()}
                    </span>
                  ) : null}
                  <p className="text-[10px] text-white/30 mt-0.5">Tap to view</p>
                </div>
              </div>

              {/* Dots */}
              {promoDeals.length > 1 && (
                <div className="flex gap-1 justify-center mt-3">
                  {promoDeals.map((_, i) => (
                    <div
                      key={i}
                      className={`h-[3px] rounded-full transition-all duration-300 ${
                        i === promoIndex ? 'w-5 bg-white/60' : 'w-[3px] bg-white/15'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </button>
        )}

        {/* Browse all + Credits */}
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] text-stone-300">
            Curated by <span className="text-stone-400 font-medium">Dom</span> from <span className="text-stone-400 font-medium">Adtech Chat MENA</span>
          </p>
          <a href="/deals" className="text-[10px] font-medium text-stone-400 hover:text-stone-600 transition-colors">
            Browse all deals
          </a>
        </div>
      </div>

      {openDeal && typeof document !== 'undefined' && createPortal(
        <DealDetail deal={openDeal} open={true} onClose={() => setOpenDeal(null)} onChangeDeal={setOpenDeal} />,
        document.body
      )}
    </section>
  );
}
