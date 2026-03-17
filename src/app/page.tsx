'use client';

import { useState } from 'react';
import { useDeals } from '@/contexts/deals-context';
import { TopBar } from '@/components/top-bar';
import { Hero } from '@/components/hero';
import { CategoryBar } from '@/components/category-bar';
import { DealFeed } from '@/components/deal-feed';
import { BackToTop } from '@/components/back-to-top';
import { AskWidget } from '@/components/ask-widget';
import { BottomNav } from '@/components/bottom-nav';
import { SearchOverlay } from '@/components/search-overlay';
import { SavedDeals } from '@/components/saved-deals';

type Tab = 'home' | 'saved' | 'search' | 'ask';

export default function HomePage() {
  const { setSearch } = useDeals();
  const [searchOpen, setSearchOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('home');

  return (
    <main className="min-h-screen bg-stone-50 pb-20 md:pb-0">
      <TopBar />

      {/* Tab content — instant switch, no route change */}
      <div className={activeTab !== 'saved' ? 'block' : 'hidden'}>
        <Hero />
        <CategoryBar />
        <DealFeed />
      </div>

      <div className={activeTab === 'saved' ? 'block' : 'hidden'}>
        <SavedDeals />
      </div>

      <BackToTop />
      <AskWidget externalOpen={askOpen} onExternalClose={() => { setAskOpen(false); setActiveTab('home'); }} />
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSearchOpen={() => setSearchOpen(true)}
        onSearchClose={() => { setSearchOpen(false); setActiveTab('home'); }}
        onAskOpen={() => setAskOpen(true)}
        onAskClose={() => { setAskOpen(false); setActiveTab('home'); }}
      />
      <SearchOverlay open={searchOpen} onClose={() => { setSearchOpen(false); setActiveTab('home'); setSearch(''); }} />
    </main>
  );
}
