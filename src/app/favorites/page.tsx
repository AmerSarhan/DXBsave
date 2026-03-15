'use client';

import { TopBar } from '@/components/top-bar';
import { DealCard } from '@/components/deal-card';
import { useDeals } from '@/contexts/deals-context';
import { Heart, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function FavoritesPage() {
  const { favoriteDeals } = useDeals();

  return (
    <main className="min-h-screen bg-white">
      <TopBar />
      <div className="pt-20 px-4 max-w-7xl mx-auto pb-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all deals
        </Link>

        <h1 className="text-3xl font-bold text-neutral-900 mb-1">Saved Deals</h1>
        <p className="text-neutral-500 mb-8">
          {favoriteDeals.length} deal{favoriteDeals.length !== 1 ? 's' : ''} saved
        </p>

        {favoriteDeals.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 mx-auto text-neutral-200 mb-4" />
            <h2 className="text-xl font-semibold text-neutral-800 mb-2">No saved deals yet</h2>
            <p className="text-neutral-500 mb-6">
              Tap the heart icon on any deal to save it here
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-neutral-900 text-white rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors"
            >
              Browse Deals
            </Link>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {favoriteDeals.map((deal) => (
                <motion.div
                  key={deal.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <DealCard deal={deal} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </main>
  );
}
