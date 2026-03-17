'use client';

import { Heart, Share2, ExternalLink, Phone, Copy, Check, X, MapPin, Clock, Flame, ArrowRight, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { cn, generateWhatsAppUrl } from '@/lib/utils';
import { useDeals } from '@/contexts/deals-context';
import { CATEGORIES } from '@/lib/constants';
import { AnyDeal, HotelDeal, DiningDeal, DeliveryDeal, SpaDeal } from '@/lib/types';
import { PriceDisplay } from './deal-card';
import { DirhamIcon } from './dirham-icon';
import { toast } from 'sonner';

interface DealDetailProps {
  deal: AnyDeal;
  open: boolean;
  onClose: () => void;
  onChangeDeal?: (deal: AnyDeal) => void;
}

export function DealDetail({ deal, open, onClose, onChangeDeal }: DealDetailProps) {
  const { toggleFavorite, isFavorite, getRelatedDeals } = useDeals();
  const [linkCopied, setLinkCopied] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const fav = isFavorite(deal.id);
  const config = CATEGORIES.find(c => c.key === deal.category);
  const related = getRelatedDeals(deal);

  const handleShare = async () => {
    const url = `${window.location.origin}/deal/${deal.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: deal.name, text: deal.offer, url });
      } catch { /* cancelled */ }
    } else {
      window.open(generateWhatsAppUrl(deal, url), '_blank');
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/deal/${deal.slug}`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleSwapDeal = (r: AnyDeal) => {
    if (!onChangeDeal) return;
    setSwapping(true);
    setTimeout(() => {
      onChangeDeal(r);
      panelRef.current?.scrollTo({ top: 0 });
      setTimeout(() => setSwapping(false), 50);
    }, 150);
  };

  const details: { label: string; value: string }[] = [];
  if (deal.category === 'hotels') {
    const h = deal as HotelDeal;
    if (h.tier) details.push({ label: 'Type', value: h.tier });
    if (h.inclusions) details.push({ label: 'Inclusions', value: h.inclusions });
    if (h.discount && h.discount !== '-') details.push({ label: 'Discount', value: h.discount });
    if (h.residentOnly) details.push({ label: 'Note', value: 'UAE Residents Only' });
    if (h.bookVia) details.push({ label: 'Book Via', value: h.bookVia });
  } else if (deal.category === 'dining') {
    const d = deal as DiningDeal;
    if (d.days) details.push({ label: 'Days', value: d.days });
    if (d.timing) details.push({ label: 'Timing', value: d.timing });
    if (d.terms) details.push({ label: 'Terms', value: d.terms });
    if (d.contact) details.push({ label: 'Contact', value: d.contact });
  } else if (deal.category === 'delivery') {
    const d = deal as DeliveryDeal;
    if (d.promoCode && d.promoCode !== 'N/A') details.push({ label: 'Code', value: d.promoCode });
    if (d.minOrder) details.push({ label: 'Min Order', value: `AED ${d.minOrder}` });
    if (d.terms) details.push({ label: 'Terms', value: d.terms });
    if (d.coverage) details.push({ label: 'Area', value: d.coverage });
  } else if (deal.category === 'spa') {
    const s = deal as SpaDeal;
    if (s.inclusions) details.push({ label: 'Includes', value: s.inclusions });
    if (s.discount && s.discount !== '-') details.push({ label: 'Discount', value: s.discount });
    if (s.booking) details.push({ label: 'Booking', value: s.booking });
  }
  if (deal.notes) details.push({ label: 'Notes', value: deal.notes });

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  const isFree = deal.price?.toLowerCase().includes('free') || deal.offer?.toLowerCase().includes('free');

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-black/40"
          />

          <div
            className={cn(
              'fixed z-[70] bg-white shadow-2xl animate-panel-in flex flex-col',
              'inset-x-0 bottom-0 top-3 rounded-t-[20px]',
              'md:inset-auto md:top-1/2 md:left-1/2 md:w-[560px] md:max-h-[85vh] md:rounded-2xl'
            )}
          >
            <div ref={panelRef} className={cn('flex-1 overflow-y-auto overscroll-contain transition-opacity duration-150', swapping ? 'opacity-0' : 'opacity-100')}>

              {/* Hero header with category color */}
              <div className={cn('relative px-5 pt-5 pb-4', config?.bgColor)}>
                {/* Drag handle on mobile */}
                <div className="md:hidden flex justify-center mb-3">
                  <div className="w-8 h-1 rounded-full bg-black/10" />
                </div>

                {/* Close */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/80 backdrop-blur-sm active:scale-95 transition-transform duration-100"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-stone-600" />
                </button>

                {/* Category + badges */}
                <div className="flex items-center gap-2 mb-3">
                  {config && <config.icon className={cn('w-4 h-4', config.color)} />}
                  <span className={cn('text-[11px] font-bold uppercase tracking-wider', config?.color)}>
                    {config?.label}
                  </span>
                  {deal.isExpiringSoon && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-white/60 text-red-600">
                      <Flame className="w-2.5 h-2.5" />
                      Ending soon
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 className="text-[22px] font-bold text-stone-900 leading-tight mb-1">{deal.name}</h2>

                {/* Location */}
                {(deal.location || deal.emirate) && (
                  <div className="flex items-center gap-1 text-[12px] text-stone-500">
                    <MapPin className="w-3 h-3" />
                    {[deal.location, deal.emirate].filter(Boolean).join(', ')}
                  </div>
                )}
              </div>

              <div className="px-5">
                {/* Price hero */}
                {deal.price && (
                  <div className="py-4 flex items-baseline gap-3 border-b border-stone-100">
                    {isFree ? (
                      <span className="text-3xl font-black text-emerald-600">FREE</span>
                    ) : (
                      <PriceDisplay price={deal.price} className="text-3xl font-black text-stone-900" />
                    )}
                    {'normalRate' in deal && deal.normalRate && deal.normalRate !== deal.price && (
                      <span className="text-[15px] text-stone-300 line-through">{deal.normalRate}</span>
                    )}
                    {'discount' in deal && deal.discount && deal.discount !== '-' && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                        {deal.discount} off
                      </span>
                    )}
                  </div>
                )}

                {/* Offer description */}
                <div className="py-4 border-b border-stone-100">
                  <p className="text-[14px] text-stone-600 leading-relaxed">{deal.offer}</p>
                  {deal.validUntil && (
                    <div className="flex items-center gap-1.5 text-[12px] text-stone-400 mt-2">
                      <Clock className="w-3 h-3" />
                      Valid: {deal.validUntil}
                    </div>
                  )}
                </div>

                {/* Details grid */}
                {details.length > 0 && (
                  <div className="py-4 border-b border-stone-100 grid grid-cols-2 gap-3">
                    {details.map((d, i) => (
                      <div key={i} className={cn(details.length % 2 !== 0 && i === details.length - 1 ? 'col-span-2' : '')}>
                        <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-0.5">
                          {d.label}
                        </p>
                        <p className="text-[13px] text-stone-700 leading-snug">{d.value}</p>
                      </div>
                    ))}
                  </div>
                )}

                </div>

              {/* Related deals */}
              {related.length > 0 && (
                <div className="px-5 pt-2 pb-8">
                  <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-3">
                    You might also like
                  </p>
                  <div className="space-y-2">
                    {related.map(r => {
                      const rConfig = CATEGORIES.find(c => c.key === r.category);
                      const rFree = r.price?.toLowerCase().includes('free') || r.offer?.toLowerCase().includes('free');
                      return (
                        <button
                          key={r.id}
                          onClick={() => handleSwapDeal(r)}
                          className="w-full text-left flex items-center gap-3 p-3 rounded-2xl bg-stone-50 active:bg-stone-100 active:scale-[0.97] transition-[transform,background-color] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
                        >
                          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', rConfig?.bgColor || 'bg-stone-100')}>
                            {rConfig && <rConfig.icon className={cn('w-4.5 h-4.5', rConfig.color)} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-stone-800 truncate">{r.name}</p>
                            <p className="text-[11px] text-stone-400 truncate">{r.offer}</p>
                          </div>
                          <div className="shrink-0 flex items-center gap-1.5">
                            {rFree ? (
                              <span className="text-[12px] font-bold text-emerald-600">FREE</span>
                            ) : r.price ? (
                              <span className="text-[13px] font-bold text-stone-800 inline-flex items-center gap-0.5">
                                <DirhamIcon className="w-2.5 h-2.5 opacity-50" />
                                {r.price.replace(/[^0-9,+]/g, '').trim() || r.price}
                              </span>
                            ) : null}
                            <ChevronRight className="w-3.5 h-3.5 text-stone-300" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky bottom actions */}
            <div className="shrink-0 border-t border-stone-100 bg-white px-5 py-3 safe-bottom">
              <div className="flex gap-2">
                {'bookVia' in deal && deal.bookVia && (() => {
                  const raw = String(deal.bookVia).trim();
                  const isUrl = /^https?:\/\//i.test(raw);
                  const isPhone = /^[+\d][\d\s()-]{5,}$/.test(raw);
                  if (!isUrl && !isPhone) return null;
                  return (
                    <a
                      href={isUrl ? raw : `tel:${raw.replace(/[^\d+]/g, '')}`}
                      target={isUrl ? '_blank' : undefined}
                      rel={isUrl ? 'noopener noreferrer' : undefined}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-stone-900 text-white rounded-xl font-semibold text-[14px] active:scale-[0.97] transition-transform duration-[160ms]"
                    >
                      {isUrl ? <><ExternalLink className="w-4 h-4" /> Book Now</> : <><Phone className="w-4 h-4" /> Call</>}
                    </a>
                  );
                })()}
                <button
                  onClick={() => toggleFavorite(deal.id)}
                  className={cn(
                    'px-4 py-3 rounded-xl active:scale-[0.97] transition-transform duration-[160ms]',
                    fav ? 'bg-red-50 text-red-600' : 'bg-stone-100 text-stone-600'
                  )}
                >
                  <Heart className={cn('w-5 h-5', fav && 'fill-red-500')} />
                </button>
                <button
                  onClick={handleShare}
                  className="px-4 py-3 rounded-xl bg-stone-100 text-stone-600 active:scale-[0.97] transition-transform duration-[160ms]"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-3 rounded-xl bg-stone-100 text-stone-600 active:scale-[0.97] transition-transform duration-[160ms]"
                >
                  {linkCopied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
