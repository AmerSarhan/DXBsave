'use client';

import { Heart } from 'lucide-react';
import { useDeals } from '@/contexts/deals-context';
import { DealCard } from './deal-card';

export function SavedDeals() {
  const { favoriteDeals } = useDeals();

  return (
    <div className="pt-20 px-4 max-w-7xl mx-auto pb-8">
      {favoriteDeals.length === 0 ? (
        <div className="text-center py-24">
          <Heart className="w-14 h-14 mx-auto text-stone-200 mb-4" />
          <h2 className="text-xl font-bold text-stone-700 mb-1.5">Your saved deals</h2>
          <p className="text-[14px] text-stone-400 max-w-[240px] mx-auto">
            Tap the heart on any deal and it will show up here
          </p>
        </div>
      ) : (
        <>
        <h1 className="text-2xl font-bold text-stone-900 mb-1">Saved Deals</h1>
        <p className="text-[13px] text-stone-400 mb-6">
          {favoriteDeals.length} deal{favoriteDeals.length !== 1 ? 's' : ''}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {favoriteDeals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
        </>
      )}
    </div>
  );
}
