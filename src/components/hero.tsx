'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDeals } from '@/contexts/deals-context';
import { Zap, TrendingUp, MapPin, Tag, Building2, UtensilsCrossed, Ticket, ChevronRight } from 'lucide-react';
import { DirhamIcon } from './dirham-icon';
import { AnyDeal } from '@/lib/types';
import { DealDetail } from './deal-detail';
import { createPortal } from 'react-dom';

const TAGLINES = [
  'Hotels & Staycations',
  'Dining & Happy Hours',
  'Free Attractions',
  'Delivery Promo Codes',
  'Spa & Wellness',
];

function SpotlightCard({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  title,
  subtitle,
  price,
  badge,
  delay,
  deal,
  onOpen,
}: {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  label: string;
  title: string;
  subtitle: string;
  price?: string;
  badge?: string;
  delay: number;
  deal?: AnyDeal;
  onOpen?: (deal: AnyDeal) => void;
}) {
  return (
    <div className="flex-1 min-w-[150px] sm:min-w-0 snap-start">
      <button
        onClick={() => deal && onOpen?.(deal)}
        className="w-full text-left p-3 sm:p-3.5 bg-white rounded-xl border border-neutral-100 hover:border-neutral-200 hover:shadow-md active:scale-[0.97] transition-all duration-200 cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <div className={`w-6 h-6 rounded-lg ${iconBg} flex items-center justify-center`}>
              <Icon className={`w-3 h-3 ${iconColor}`} />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${iconColor}`}>{label}</span>
          </div>
          <ChevronRight className="w-3 h-3 text-neutral-300 group-hover:text-neutral-500 transition-colors" />
        </div>
        <p className="text-[12px] sm:text-[13px] font-semibold text-neutral-800 leading-tight truncate">{title}</p>
        <p className="text-[10px] sm:text-[11px] text-neutral-400 truncate mb-2">{subtitle}</p>
        <div className="flex items-center gap-1.5">
          {price && (
            <span className="inline-flex items-center gap-0.5 text-[13px] sm:text-sm font-bold text-neutral-900">
              <DirhamIcon className="w-3 h-3 opacity-70" />
              {price}
            </span>
          )}
          {badge && (
            <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
      </button>
    </div>
  );
}

export function Hero() {
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [openDeal, setOpenDeal] = useState<AnyDeal | null>(null);
  const { allDeals, dealsByCategory } = useDeals();

  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineIndex(prev => (prev + 1) % TAGLINES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Rotate through deals every 5 seconds
  const hotelDeals = dealsByCategory.hotels || [];
  const diningDeals = dealsByCategory.dining || [];
  const attractionDeals = dealsByCategory.attractions || [];

  useEffect(() => {
    if (openDeal) return; // pause shuffle when detail is open
    const maxLen = Math.max(hotelDeals.length, diningDeals.length, attractionDeals.length, 1);
    const interval = setInterval(() => {
      setSpotlightIndex(prev => (prev + 1) % maxLen);
    }, 5000);
    return () => clearInterval(interval);
  }, [hotelDeals.length, diningDeals.length, attractionDeals.length, openDeal]);

  const hotelDeal = hotelDeals[spotlightIndex % Math.max(hotelDeals.length, 1)];
  const diningDeal = diningDeals[spotlightIndex % Math.max(diningDeals.length, 1)];
  const attractionDeal = attractionDeals[spotlightIndex % Math.max(attractionDeals.length, 1)];

  return (
    <section className="relative pt-18 pb-3 overflow-x-clip">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/80 via-slate-50/50 to-white pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-bl from-blue-100/40 via-cyan-50/20 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-20 left-0 w-[400px] h-[400px] bg-gradient-to-br from-indigo-100/20 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-5 pt-6 pb-2 z-10">
        {/* Live badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex justify-center mb-4"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur border border-neutral-200/60 shadow-sm">
            <motion.div
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Zap className="w-3 h-3 text-amber-500" />
            </motion.div>
            <span className="text-[11px] font-semibold text-neutral-600">Live</span>
            <div className="w-px h-3 bg-neutral-200" />
            <span className="text-[11px] text-neutral-500">{allDeals.length}+ deals</span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-2"
        >
          <h1 className="text-[1.75rem] sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.15]">
            <span className="text-neutral-900">Discover </span>
            <span className="bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
              the best deals
            </span>
            <br className="sm:hidden" />
            <span className="text-neutral-900"> across the UAE</span>
          </h1>
        </motion.div>

        {/* Animated tagline */}
        <div className="h-6 flex items-center justify-center mb-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={taglineIndex}
              initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 text-neutral-400"
            >
              <Tag className="w-3.5 h-3.5" />
              <span className="text-sm font-medium">{TAGLINES[taglineIndex]}</span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Spotlight deal cards */}
        <div className="relative mb-5">
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none sm:hidden" />
          <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none sm:hidden" />
          <div
            className="flex gap-3 overflow-x-auto no-scrollbar sm:overflow-visible p-3 rounded-2xl bg-neutral-50/60 border border-neutral-100/50"
          >
            <SpotlightCard
              icon={Building2}
              iconColor="text-slate-600"
              iconBg="bg-slate-100"
              label="Hotels"
              title={hotelDeal?.name || '...'}
              subtitle={hotelDeal?.offer || ''}
              price={hotelDeal?.price?.replace(/[^0-9]/g, '') || ''}
              delay={0}
              deal={hotelDeal}
              onOpen={setOpenDeal}
            />
            <SpotlightCard
              icon={UtensilsCrossed}
              iconColor="text-amber-700"
              iconBg="bg-amber-50"
              label="Dining"
              title={diningDeal?.name || '...'}
              subtitle={diningDeal?.offer || ''}
              price={diningDeal?.price?.replace(/[^0-9]/g, '') || ''}
              delay={0}
              deal={diningDeal}
              onOpen={setOpenDeal}
            />
            <SpotlightCard
              icon={Ticket}
              iconColor="text-teal-700"
              iconBg="bg-teal-50"
              label="Attractions"
              title={attractionDeal?.name || '...'}
              subtitle={attractionDeal?.offer || ''}
              badge={attractionDeal?.price?.toLowerCase().includes('free') ? 'FREE' : ''}
              price={attractionDeal?.price?.toLowerCase().includes('free') ? '' : attractionDeal?.price?.replace(/[^0-9]/g, '')}
              delay={0}
              deal={attractionDeal}
              onOpen={setOpenDeal}
            />
          </div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex items-center justify-center gap-4 sm:gap-6 text-[11px] sm:text-xs text-neutral-400"
        >
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span>7 Emirates</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-neutral-300" />
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Updated daily</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-neutral-300" />
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            <span>100% free</span>
          </div>
        </motion.div>

        {/* Credits */}
        <p className="text-center text-[11px] text-neutral-300 mt-4">
          Curated by <span className="text-neutral-400 font-medium">Dom</span> from <span className="text-neutral-400 font-medium">Adtech Chat MENA</span> WhatsApp Group
        </p>
      </div>

      {/* Deal detail portal — rendered outside hero DOM to avoid z-index/overflow issues */}
      {openDeal && typeof document !== 'undefined' && createPortal(
        <DealDetail deal={openDeal} open={true} onClose={() => setOpenDeal(null)} />,
        document.body
      )}
    </section>
  );
}
