'use client';

import { Heart, Share2, ExternalLink, Phone, Copy, Check, X, MapPin, Clock, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { cn, generateWhatsAppUrl } from '@/lib/utils';
import { useDeals } from '@/contexts/deals-context';
import { CATEGORIES } from '@/lib/constants';
import { AnyDeal, HotelDeal, DiningDeal, DeliveryDeal, SpaDeal } from '@/lib/types';
import { DealCard } from './deal-card';
import { DirhamIcon } from './dirham-icon';
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

  // Extract category-specific details
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

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm"
          />

          {/* Content — responsive: bottom sheet on mobile, modal on desktop */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              'fixed z-[70] bg-white overflow-y-auto',
              // Mobile: bottom sheet
              'inset-x-0 bottom-0 max-h-[85vh] rounded-t-3xl',
              // Desktop: centered modal
              'md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2',
              'md:max-h-[80vh] md:w-full md:max-w-lg md:rounded-2xl'
            )}
          >
            {/* Drag handle (mobile) */}
            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-neutral-300 rounded-full" />
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors z-10"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-neutral-600" />
            </button>

            <div className="p-6 pt-4 md:pt-6">
              {/* Category + badges */}
              <div className="flex items-center gap-2 mb-4">
                <span className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
                  config?.bgColor, config?.color
                )}>
                  {config && <config.icon className="w-3 h-3" />}
                  {config?.label}
                </span>
                {deal.isExpiringSoon && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600">
                    <Flame className="w-3 h-3" />
                    Expiring Soon
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">{deal.name}</h2>

              {/* Location */}
              {(deal.location || deal.emirate) && (
                <div className="flex items-center gap-1.5 text-sm text-neutral-500 mb-4">
                  <MapPin className="w-4 h-4" />
                  <span>{[deal.location, deal.emirate].filter(Boolean).join(', ')}</span>
                </div>
              )}

              {/* Offer */}
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100 mb-4">
                <p className="text-sm font-medium text-neutral-800">{deal.offer}</p>
                {deal.price && (
                  <p className="text-2xl font-bold text-neutral-900 mt-2 inline-flex items-center gap-1">
                    <DirhamIcon className="w-5 h-5 opacity-70" />
                    {deal.price.replace(/[^0-9.,FREE free]/gi, '').trim() || deal.price}
                  </p>
                )}
              </div>

              {/* Valid until */}
              {deal.validUntil && (
                <div className="flex items-center gap-1.5 text-sm text-neutral-500 mb-4">
                  <Clock className="w-4 h-4" />
                  <span>Valid: {deal.validUntil}</span>
                </div>
              )}

              {/* Details grid */}
              {details.length > 0 && (
                <div className="space-y-3 mb-6">
                  {details.map((d, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider w-24 shrink-0 pt-0.5">
                        {d.label}
                      </span>
                      <span className="text-sm text-neutral-700 flex-1">{d.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 mb-6">
                {'bookVia' in deal && deal.bookVia && (
                  <a
                    href={deal.bookVia.startsWith('http') ? deal.bookVia : `tel:${deal.bookVia}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-neutral-900 text-white rounded-xl font-medium text-sm hover:bg-neutral-800 transition-colors"
                  >
                    {deal.bookVia.startsWith('http') ? (
                      <><ExternalLink className="w-4 h-4" /> Book Now</>
                    ) : (
                      <><Phone className="w-4 h-4" /> Call to Book</>
                    )}
                  </a>
                )}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleFavorite(deal.id)}
                  className={cn(
                    'px-4 py-3 rounded-xl font-medium text-sm transition-colors flex items-center gap-2',
                    fav
                      ? 'bg-red-50 text-red-600 border border-red-200'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  )}
                >
                  <Heart className={cn('w-4 h-4', fav && 'fill-red-500')} />
                  {fav ? 'Saved' : 'Save'}
                </motion.button>
              </div>

              {/* Share row */}
              <div className="flex gap-2 mb-8">
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 text-sm font-medium transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Share via WhatsApp
                </button>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-100 text-neutral-600 hover:bg-neutral-200 text-sm font-medium transition-colors"
                >
                  {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {linkCopied ? 'Copied' : 'Copy Link'}
                </button>
              </div>

              {/* Related deals */}
              {related.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                    Related Deals
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
