'use client';

import { TopBar } from '@/components/top-bar';
import { Hero } from '@/components/hero';
import { CategoryBar } from '@/components/category-bar';
import { FilterBar } from '@/components/filter-bar';
import { DealFeed } from '@/components/deal-feed';
import { BackToTop } from '@/components/back-to-top';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <TopBar />
      <Hero />
      <CategoryBar />
      <FilterBar />
      <DealFeed />
      <BackToTop />
    </main>
  );
}
