'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Search, Flame, MapPin, Mail, Check, ArrowRight } from 'lucide-react';
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

  // Pick one deal per category for variety
  const promoDeals = (() => {
    const seen = new Set<string>();
    const picks = allDeals.filter(d => {
      if (seen.has(d.category)) return false;
      if (!d.price && !d.offer.toLowerCase().includes('free')) return false;
      seen.add(d.category);
      return true;
    });
    return picks.slice(0, 5);
  })();

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

        {/* Featured deal */}
        {promoDeal && (() => {
          const promoCatImage = CATEGORY_IMAGES.find(c => c.key === promoDeal.category)?.image;
          return (
            <button
              onClick={() => setOpenDeal(promoDeal)}
              className="w-full text-left mb-4 rounded-2xl overflow-hidden active:scale-[0.98] transition-transform duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] bg-stone-900"
            >
              <div key={promoDeal.id} className="animate-fade-in relative p-4 flex items-center gap-4 min-h-[110px]">
                {/* Category illustration — right side, bright on dark */}
                {promoCatImage && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 w-24 h-24 promo-float">
                    <Image src={promoCatImage} alt="" width={96} height={96} className="object-contain w-full h-full brightness-125 drop-shadow-[0_4px_12px_rgba(255,255,255,0.15)]" />
                  </div>
                )}

                {/* Content */}
                <div className="relative flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    {promoDeal.isExpiringSoon && (
                      <Flame className="w-3 h-3 text-orange-400" />
                    )}
                    <span className="text-[11px] font-medium text-white/40">
                      {promoDeal.emirate || promoDeal.location || 'UAE'}
                    </span>
                  </div>
                  <p className="text-[16px] font-bold text-white leading-snug mb-0.5 line-clamp-1 pr-16">{promoDeal.name}</p>
                  <p className="text-[12px] text-white/40 line-clamp-1 pr-16">{promoDeal.offer}</p>
                  <div className="mt-2.5 flex items-center gap-3">
                    {promoDeal.price?.toLowerCase().includes('free') ? (
                      <span className="text-[15px] font-black text-emerald-400">FREE</span>
                    ) : promoDeal.price ? (
                      <span className="text-[15px] font-bold text-white inline-flex items-center gap-0.5">
                        <DirhamIcon className="w-3 h-3 opacity-50" />
                        {promoDeal.price.replace(/[^0-9,]/g, '').trim()}
                      </span>
                    ) : null}
                    {promoDeals.length > 1 && (
                      <div className="flex gap-1">
                        {promoDeals.map((_, i) => (
                          <div
                            key={i}
                            className={`h-[3px] rounded-full transition-all duration-300 ${
                              i === promoIndex ? 'w-4 bg-white/50' : 'w-[3px] bg-white/15'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })()}

        {/* Browse all + Credits */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] text-stone-300">
            Curated by <span className="text-stone-400 font-medium">Dom</span> from <span className="text-stone-400 font-medium">Adtech Chat MENA</span>
          </p>
          <a href="/deals" className="text-[10px] font-medium text-stone-400 hover:text-stone-600 transition-colors">
            Browse all deals
          </a>
        </div>

        {/* Email capture */}
        <EmailCapture />
      </div>

      {openDeal && typeof document !== 'undefined' && createPortal(
        <DealDetail deal={openDeal} open={true} onClose={() => setOpenDeal(null)} onChangeDeal={setOpenDeal} />,
        document.body
      )}
    </section>
  );
}

function EmailCapture() {
  const [email, setEmail] = useState('');
  const [hp, setHp] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status === 'loading') return;
    setStatus('loading');
    try {
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, hp }),
      });
    } finally {
      setStatus('done');
    }
  };

  if (status === 'done') {
    return (
      <div className="flex items-center justify-center gap-2 py-2.5 mb-1">
        <Check className="w-3.5 h-3.5 text-emerald-500" />
        <span className="text-[12px] text-stone-500">You&apos;re in! We&apos;ll send you the best deals weekly.</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mb-1 rounded-2xl bg-white ring-1 ring-stone-100 p-4">
      <div className="flex items-center gap-2 mb-1">
        <Mail className="w-4 h-4 text-stone-900" />
        <p className="text-[14px] font-bold text-stone-900">Never miss a deal</p>
      </div>
      <p className="text-[12px] text-stone-400 mb-3">Best UAE deals in your inbox, once a week. No spam.</p>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Your email"
            required
            className="w-full px-3 py-2.5 bg-stone-50 rounded-xl text-[16px] md:text-[13px] outline-none ring-1 ring-stone-100 placeholder:text-stone-300 text-stone-700 focus:ring-stone-300 transition-[box-shadow] duration-200"
          />
          {/* Honeypot */}
          <input type="text" value={hp} onChange={e => setHp(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute opacity-0 h-0 w-0 overflow-hidden pointer-events-none" />
        </div>
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-5 py-2.5 bg-stone-900 text-white rounded-xl text-[13px] font-semibold shrink-0 active:scale-95 transition-transform duration-100 disabled:opacity-50"
        >
          {status === 'loading'
            ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
            : 'Subscribe'
          }
        </button>
      </div>
    </form>
  );
}
