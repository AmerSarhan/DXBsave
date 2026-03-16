'use client';

import { useState } from 'react';
import { Heart, Share2, MapPin, Copy, Check, Flame, TrendingUp, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDeals } from '@/contexts/deals-context';
import { CATEGORIES } from '@/lib/constants';
import { AnyDeal, DeliveryDeal } from '@/lib/types';
import { DealDetail } from './deal-detail';
import { DirhamIcon } from './dirham-icon';
import { toast } from 'sonner';
import { generateWhatsAppUrl } from '@/lib/utils';

function isFreePrice(price: string): boolean {
  const l = price.toLowerCase().trim();
  return l.includes('free') || l === '0' || l === 'complimentary';
}

function PriceDisplay({ price, className }: { price: string; className?: string }) {
  const lower = price.toLowerCase().trim();

  // FREE variants — "FREE", "FREE (was 320+)", "Free → 99", "complimentary"
  if (isFreePrice(price)) {
    return <span className={cn('font-bold text-emerald-600', className)}>FREE</span>;
  }

  // Percentage discounts — "15% off"
  if (/^\d+%/.test(lower)) {
    return <span className={cn('text-stone-600', className)}>{price}</span>;
  }

  // "SUSPENDED" or status text
  if (lower.includes('suspend') || lower.includes('varies') || lower.includes('entry')) {
    return <span className={cn('text-stone-500 text-[13px]', className)}>{price}</span>;
  }

  // No number at all — plain text
  const match = price.match(/(\d[\d,]*(?:\.\d+)?)/);
  if (!match) {
    return <span className={cn('text-stone-500 text-[13px]', className)}>{price}</span>;
  }

  // Range: "150–200", "600-800"
  const rangeMatch = price.match(/(\d[\d,]*)\s*[–\-~]\s*(\d[\d,]*)/);
  if (rangeMatch) {
    return (
      <span className={cn('inline-flex items-center gap-0.5', className)}>
        <DirhamIcon className="w-[0.6em] h-[0.6em] opacity-50" />
        {rangeMatch[1]}–{rangeMatch[2]}
      </span>
    );
  }

  // "From 40", "from AED 40"
  const fromMatch = price.match(/from\s+(?:aed\s+)?(\d[\d,]*)/i);
  if (fromMatch) {
    return (
      <span className={cn('inline-flex items-center gap-0.5', className)}>
        From <DirhamIcon className="w-[0.6em] h-[0.6em] opacity-50 ml-1" />
        {fromMatch[1]}
      </span>
    );
  }

  // "1,043+" or "600+"
  const plusMatch = price.match(/(\d[\d,]*)\+/);
  if (plusMatch) {
    return (
      <span className={cn('inline-flex items-center gap-0.5', className)}>
        <DirhamIcon className="w-[0.6em] h-[0.6em] opacity-50" />
        {plusMatch[1]}+
      </span>
    );
  }

  // "600 (equiv/night)" — extract just the number
  const numOnly = match[1];
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)}>
      <DirhamIcon className="w-[0.6em] h-[0.6em] opacity-50" />
      {numOnly}
    </span>
  );
}

export { PriceDisplay };

interface DealCardProps {
  deal: AnyDeal;
  compact?: boolean;
  onDetailOpen?: () => void;
}

export function DealCard({ deal, compact, onDetailOpen }: DealCardProps) {
  const { toggleFavorite, isFavorite, recordTap, getTaps, isTrending: checkTrending } = useDeals();
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeDeal, setActiveDeal] = useState<AnyDeal>(deal);
  const [copied, setCopied] = useState(false);

  const fav = isFavorite(deal.id);
  const config = CATEGORIES.find(c => c.key === deal.category);
  const isDelivery = deal.category === 'delivery';
  const promoCode = isDelivery ? (deal as DeliveryDeal).promoCode : '';
  const taps = getTaps(deal.id);
  const trending = checkTrending(deal.id);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/deal/${deal.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: deal.name, text: deal.offer, url });
      } catch { /* cancelled */ }
    } else {
      window.open(generateWhatsAppUrl(deal, url), '_blank');
    }
  };

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(promoCode);
    setCopied(true);
    toast.success('Promo code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenDetail = () => {
    recordTap(deal.id);
    if (onDetailOpen) onDetailOpen();
    setDetailOpen(true);
  };

  if (compact) {
    return (
      <>
        <button
          onClick={handleOpenDetail}
          className="w-full text-left p-3 rounded-xl bg-neutral-50 active:bg-neutral-100 active:scale-[0.97] transition-[transform,background-color] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] flex items-center gap-3"
        >
          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', config?.bgColor)}>
            {config && <config.icon className={cn('w-4 h-4', config.color)} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[13px] text-neutral-900 truncate">{deal.name}</p>
            <p className="text-[11px] text-neutral-400 truncate">{deal.offer}</p>
          </div>
          {deal.price && (
            <PriceDisplay price={deal.price} className="text-[13px] font-bold text-neutral-900 whitespace-nowrap" />
          )}
        </button>
        <DealDetail deal={activeDeal} open={detailOpen} onClose={() => { setDetailOpen(false); setActiveDeal(deal); }} onChangeDeal={setActiveDeal} />
      </>
    );
  }

  return (
    <>
      <article
        onClick={handleOpenDetail}
        className="group bg-white rounded-xl shadow-sm shadow-stone-200/60 cursor-pointer overflow-hidden transition-[transform,box-shadow] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] hover-lift"
      >
        {/* Horizontal layout: icon strip left, content right */}
        <div className="flex">
          {/* Left accent strip */}
          <div className={cn('w-14 shrink-0 flex flex-col items-center justify-center gap-1.5 py-4', config?.bgColor)}>
            {config && <config.icon className={cn('w-5 h-5', config.color)} />}
            {trending && <TrendingUp className="w-3 h-3 text-amber-500" />}
            {deal.isExpiringSoon && <Flame className="w-3.5 h-3.5 text-red-400" />}
            {'isNew' in deal && deal.isNew && (
              <span className="text-[8px] font-bold text-blue-600">NEW</span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-3.5 min-w-0">
            {/* Title + Location */}
            <h3 className="font-semibold text-stone-900 text-[14px] leading-snug mb-0.5 line-clamp-1">
              {deal.name}
            </h3>
            {(deal.location || deal.emirate) && (
              <p className="text-[11px] text-stone-400 mb-1.5 flex items-center gap-0.5 truncate">
                <MapPin className="w-2.5 h-2.5 shrink-0" />
                {[deal.location, deal.emirate].filter(Boolean).join(', ')}
              </p>
            )}

            {/* Offer */}
            <p className="text-[12px] text-stone-500 mb-2 line-clamp-1">{deal.offer}</p>

            {/* Price row */}
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-1.5">
                {deal.price ? (
                  <>
                    <PriceDisplay price={deal.price} className="text-[17px] font-bold text-stone-900" />
                    {!isFreePrice(deal.price) && 'normalRate' in deal && deal.normalRate && deal.normalRate !== deal.price && (
                      <span className="text-[11px] text-stone-300 line-through">{deal.normalRate}</span>
                    )}
                    {!isFreePrice(deal.price) && 'discount' in deal && deal.discount && deal.discount !== '-' && (
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {deal.discount}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-[12px] text-stone-400">View details</span>
                )}
              </div>

              {/* Quick actions + tap count */}
              <div className="flex items-center gap-0.5">
                {taps > 0 && (
                  <span className="text-[10px] text-stone-400 flex items-center gap-0.5 mr-1">
                    <Eye className="w-2.5 h-2.5" />
                    {taps}
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(deal.id);
                  }}
                  className="p-1.5 rounded-lg hover:bg-stone-100 active:scale-[0.92] transition-[transform] duration-[100ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
                  aria-label={fav ? 'Remove from favorites' : 'Save to favorites'}
                >
                  <Heart className={cn('w-[14px] h-[14px] transition-colors', fav ? 'fill-red-500 text-red-500' : 'text-stone-300')} />
                </button>
                <button
                  onClick={handleShare}
                  className="p-1.5 rounded-lg hover:bg-stone-100 active:scale-[0.92] transition-[transform] duration-[100ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
                  aria-label="Share deal"
                >
                  <Share2 className="w-[14px] h-[14px] text-stone-300" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Promo code strip */}
        {promoCode && promoCode !== 'N/A' && (
          <div className="border-t border-stone-100 px-3.5 py-2 flex items-center justify-between bg-stone-50/50">
            <code className="font-mono text-[12px] font-bold text-stone-700">{promoCode}</code>
            <button
              onClick={handleCopyCode}
              className="text-[11px] font-medium text-stone-500 hover:text-stone-700 flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}
      </article>
      <DealDetail deal={activeDeal} open={detailOpen} onClose={() => { setDetailOpen(false); setActiveDeal(deal); }} onChangeDeal={setActiveDeal} />
    </>
  );
}
