'use client';

import { TopBar } from '@/components/top-bar';
import { Hero } from '@/components/hero';
import { CategoryBar } from '@/components/category-bar';
import { DealFeed } from '@/components/deal-feed';
import { BackToTop } from '@/components/back-to-top';
import { AskWidget } from '@/components/ask-widget';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-stone-50">
      <TopBar />
      <Hero />
      <CategoryBar />
      <DealFeed />
      <BackToTop />
      <AskWidget />
    </main>
  );
}
