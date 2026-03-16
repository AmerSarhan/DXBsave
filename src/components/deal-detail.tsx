'use client';

import { Heart, Share2, ExternalLink, Phone, Copy, Check, X, MapPin, Clock, Flame, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { cn, generateWhatsAppUrl } from '@/lib/utils';
import { useDeals } from '@/contexts/deals-context';
import { CATEGORIES } from '@/lib/constants';
import { AnyDeal, HotelDeal, DiningDeal, DeliveryDeal, SpaDeal } from '@/lib/types';
import { DealCard, PriceDisplay } from './deal-card';
import { toast } from 'sonner';

interface DealDetailProps {
  deal: AnyDeal;
  open: boolean;
  onClose: () => void;
}

export function DealDetail({ deal, open, onClose }: DealDetailProps) {
  const { toggleFavorite, isFavorite, getRelatedDeals } = useDeals();
  const [linkCopied, setLinkCopied] = useState(false);
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
    if (d.promoCode && d.promoCode !== 'N/A') details.push({ label: 'Promo Code', value: d.promoCode });
    if (d.minOrder) details.push({ label: 'Min Order', value: `AED ${d.minOrder}` });
    if (d.terms) details.push({ label: 'Terms', value: d.terms });
    if (d.coverage) details.push({ label: 'Coverage', value: d.coverage });
  } else if (deal.category === 'spa') {
    const s = deal as SpaDeal;
    if (s.inclusions) details.push({ label: 'Inclusions', value: s.inclusions });
    if (s.discount && s.discount !== '-') details.push({ label: 'Discount', value: s.discount });
    if (s.booking) details.push({ label: 'Booking', value: s.booking });
  }

  if (deal.notes) details.push({ label: 'Notes', value: deal.notes });

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-black/30"
          />

          {/* Panel — slides up on mobile, right on desktop */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.3 }}
            className={cn(
              'fixed z-[70] bg-stone-50 overflow-y-auto overscroll-contain shadow-2xl',
              // Mobile: bottom sheet, almost full screen
              'inset-x-0 bottom-0 top-4 rounded-t-2xl',
              // Desktop: right panel
              'md:inset-y-0 md:top-0 md:left-auto md:right-0 md:w-[480px] md:rounded-none'
            )}
          >
            {/* Top bar */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-stone-50/90 backdrop-blur-xl border-b border-stone-200/50">
              <div className="flex items-center gap-2">
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', config?.bgColor)}>
                  {config && <config.icon className={cn('w-3.5 h-3.5', config.color)} />}
                </div>
                <span className={cn('text-[11px] font-bold uppercase tracking-wider', config?.color)}>
                  {config?.label}
                </span>
                {deal.isExpiringSoon && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-red-50 text-red-500">
                    <Flame className="w-2.5 h-2.5" />
                    Ending soon
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-stone-200/60 active:scale-95 transition-all"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-stone-500" />
              </button>
            </div>

            <div className="px-5 py-5">
              {/* Title */}
              <h2 className="text-xl font-bold text-stone-900 mb-1.5 leading-tight">{deal.name}</h2>

              {/* Location */}
              {(deal.location || deal.emirate) && (
                <div className="flex items-center gap-1.5 text-[13px] text-stone-400 mb-5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{[deal.location, deal.emirate].filter(Boolean).join(', ')}</span>
                </div>
              )}

              {/* Offer card */}
              <div className="p-4 rounded-xl bg-white shadow-sm shadow-stone-200/60 mb-5">
                <p className="text-[13px] text-stone-600 leading-relaxed">{deal.offer}</p>
                {deal.price && (
                  <div className="mt-3 pt-3 border-t border-stone-100 flex items-baseline gap-2">
                    <PriceDisplay price={deal.price} className="text-2xl font-bold text-stone-900" />
                  </div>
                )}
              </div>

              {/* Valid until */}
              {deal.validUntil && (
                <div className="flex items-center gap-1.5 text-[13px] text-stone-400 mb-5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Valid: {deal.validUntil}</span>
                </div>
              )}

              {/* Details */}
              {details.length > 0 && (
                <div className="mb-6 space-y-0">
                  {details.map((d, i) => (
                    <div key={i} className="flex gap-4 py-2.5 border-b border-stone-100 last:border-0">
                      <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider w-20 shrink-0 pt-0.5">
                        {d.label}
                      </span>
                      <span className="text-[13px] text-stone-700 flex-1 leading-relaxed">{d.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2.5 mb-6">
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
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-stone-900 text-white rounded-xl font-medium text-sm hover:bg-stone-800 active:scale-[0.98] transition-all"
                    >
                      {isUrl ? (
                        <><ExternalLink className="w-4 h-4" /> Book Now <ArrowRight className="w-3.5 h-3.5 ml-auto" /></>
                      ) : (
                        <><Phone className="w-4 h-4" /> Call to Book</>
                      )}
                    </a>
                  );
                })()}

                <div className="flex gap-2">
                  <button
                    onClick={() => toggleFavorite(deal.id)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium active:scale-[0.98] transition-all',
                      fav
                        ? 'bg-red-50 text-red-600'
                        : 'bg-white text-stone-600 shadow-sm shadow-stone-200/60 hover:bg-stone-100'
                    )}
                  >
                    <Heart className={cn('w-4 h-4', fav && 'fill-red-500')} />
                    {fav ? 'Saved' : 'Save'}
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-stone-600 shadow-sm shadow-stone-200/60 hover:bg-stone-100 text-sm font-medium active:scale-[0.98] transition-all"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-stone-600 shadow-sm shadow-stone-200/60 hover:bg-stone-100 text-sm font-medium active:scale-[0.98] transition-all"
                  >
                    {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Related deals */}
              {related.length > 0 && (
                <div>
                  <h3 className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-3">
                    Similar Deals
                  </h3>
                  <div className="space-y-2">
                    {related.map(r => (
                      <DealCard key={r.id} deal={r} compact />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
