'use client';

import { useState } from 'react';
import { Heart, Share2, MapPin, Copy, Check, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDeals } from '@/contexts/deals-context';
import { CATEGORIES } from '@/lib/constants';
import { AnyDeal, DeliveryDeal } from '@/lib/types';
import { DealDetail } from './deal-detail';
import { DirhamIcon } from './dirham-icon';
import { toast } from 'sonner';
import { generateWhatsAppUrl } from '@/lib/utils';

function PriceDisplay({ price, className }: { price: string; className?: string }) {
  const lower = price.toLowerCase().trim();

  // FREE variants
  if (lower.includes('free') || lower === '0') {
    return <span className={cn('font-bold text-emerald-600', className)}>FREE</span>;
  }

  // Non-numeric prices: "Entry fee", "Varies", "From 40", "15% off", etc.
  // Check if there's a clear leading number
  const match = price.match(/^[^\d]*(\d[\d,]*(?:\.\d+)?)/);
  if (!match) {
    // No number found — show as plain text, no dirham icon
    return <span className={cn('text-neutral-500', className)}>{price}</span>;
  }

  // Has a range like "150–200" or "600+"
  const rangeMatch = price.match(/(\d[\d,]*)\s*[–\-~]\s*(\d[\d,]*)/);
  if (rangeMatch) {
    return (
      <span className={cn('inline-flex items-center gap-0.5', className)}>
        <DirhamIcon className="w-[0.6em] h-[0.6em] opacity-50" />
        {rangeMatch[1]}–{rangeMatch[2]}
      </span>
    );
  }

  // Has "from" prefix like "From 40"
  const fromMatch = price.match(/from\s+(\d[\d,]*)/i);
  if (fromMatch) {
    return (
      <span className={cn('inline-flex items-center gap-0.5', className)}>
        From <DirhamIcon className="w-[0.6em] h-[0.6em] opacity-50 ml-1" />
        {fromMatch[1]}
      </span>
    );
  }

  // Has "+" suffix like "1,043+"
  const plusMatch = price.match(/(\d[\d,]*)\+/);
  if (plusMatch) {
    return (
      <span className={cn('inline-flex items-center gap-0.5', className)}>
        <DirhamIcon className="w-[0.6em] h-[0.6em] opacity-50" />
        {plusMatch[1]}+
      </span>
    );
  }

  // Simple number
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)}>
      <DirhamIcon className="w-[0.6em] h-[0.6em] opacity-50" />
      {match[1]}
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
  const { toggleFavorite, isFavorite } = useDeals();
  const [detailOpen, setDetailOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const fav = isFavorite(deal.id);
  const config = CATEGORIES.find(c => c.key === deal.category);
  const isDelivery = deal.category === 'delivery';
  const promoCode = isDelivery ? (deal as DeliveryDeal).promoCode : '';

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
    if (onDetailOpen) onDetailOpen();
    setDetailOpen(true);
  };

  if (compact) {
    return (
      <>
        <button
          onClick={handleOpenDetail}
          className="w-full text-left p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 active:scale-[0.98] transition-all duration-150 flex items-center gap-3"
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
        <DealDetail deal={deal} open={detailOpen} onClose={() => setDetailOpen(false)} />
      </>
    );
  }

  return (
    <>
      <article
        onClick={handleOpenDetail}
        className="group bg-white rounded-2xl border border-neutral-100 cursor-pointer active:scale-[0.98] transition-all duration-200 hover:shadow-lg hover:shadow-neutral-900/[0.06] hover:border-neutral-200"
      >
        <div className="p-4">
          {/* Row 1: Category + location + badges */}
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', config?.bgColor)}>
                {config && <config.icon className={cn('w-3.5 h-3.5', config.color)} />}
              </div>
              <div className="min-w-0">
                <span className={cn('text-[10px] font-bold uppercase tracking-wider block', config?.color)}>
                  {config?.label}
                </span>
                {(deal.location || deal.emirate) && (
                  <span className="text-[10px] text-neutral-400 flex items-center gap-0.5">
                    <MapPin className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate">{[deal.location, deal.emirate].filter(Boolean).join(', ')}</span>
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {deal.isExpiringSoon && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-red-50 text-red-500">
                  <Flame className="w-2.5 h-2.5" />
                </span>
              )}
              {'isNew' in deal && deal.isNew && (
                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-blue-50 text-blue-600">
                  New
                </span>
              )}
            </div>
          </div>

          {/* Row 2: Title */}
          <h3 className="font-semibold text-neutral-900 text-[15px] leading-snug mb-1 line-clamp-1">
            {deal.name}
          </h3>

          {/* Row 3: Offer */}
          <p className="text-[13px] text-neutral-400 mb-3 line-clamp-1">{deal.offer}</p>

          {/* Row 4: Price + discount */}
          <div className="flex items-baseline gap-2 mb-3">
            {deal.price ? (
              <>
                <PriceDisplay price={deal.price} className="text-[20px] font-bold text-neutral-900" />
                {'normalRate' in deal && deal.normalRate && deal.normalRate !== deal.price && (
                  <span className="text-[13px] text-neutral-300 line-through">{deal.normalRate}</span>
                )}
                {'discount' in deal && deal.discount && deal.discount !== '-' && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                    {deal.discount}
                  </span>
                )}
              </>
            ) : (
              <span className="text-[13px] text-neutral-400">View for details</span>
            )}
          </div>

          {/* Promo code */}
          {promoCode && promoCode !== 'N/A' && (
            <button
              onClick={handleCopyCode}
              className="mb-3 inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-dashed border-neutral-200 bg-neutral-50 hover:bg-neutral-100 transition-colors"
            >
              <code className="font-mono text-[12px] font-bold text-neutral-700">{promoCode}</code>
              {copied ? (
                <Check className="w-3 h-3 text-emerald-500" />
              ) : (
                <Copy className="w-3 h-3 text-neutral-400" />
              )}
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-neutral-50">
          <div className="flex items-center gap-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(deal.id);
              }}
              className="p-1.5 rounded-lg hover:bg-neutral-50 active:scale-90 transition-all duration-150"
              aria-label={fav ? 'Remove from favorites' : 'Save to favorites'}
            >
              <Heart
                className={cn(
                  'w-[16px] h-[16px] transition-colors duration-200',
                  fav ? 'fill-red-500 text-red-500' : 'text-neutral-300'
                )}
              />
            </button>
            <button
              onClick={handleShare}
              className="p-1.5 rounded-lg hover:bg-neutral-50 active:scale-90 transition-all duration-150"
              aria-label="Share deal"
            >
              <Share2 className="w-[16px] h-[16px] text-neutral-300" />
            </button>
          </div>
          <span className="text-[11px] font-medium text-neutral-300 group-hover:text-neutral-500 transition-colors duration-200">
            Tap for details
          </span>
        </div>
      </article>
      <DealDetail deal={deal} open={detailOpen} onClose={() => setDetailOpen(false)} />
    </>
  );
}
