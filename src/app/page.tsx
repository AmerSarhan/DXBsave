'use client';

import { useState, useRef, useCallback } from 'react';
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
import { PullRefreshIndicator } from '@/components/pull-refresh';
import { usePullRefresh } from '@/hooks/use-pull-refresh';

type Tab = 'home' | 'saved' | 'search' | 'ask';

export default function HomePage() {
  const { setSearch, refresh } = useDeals();
  const [searchOpen, setSearchOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [askInitialQuery, setAskInitialQuery] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const scrollPositions = useRef<Record<string, number>>({ home: 0, saved: 0 });
  const lastHomeTap = useRef(0);

  const { pulling, refreshing, pullDistance } = usePullRefresh({
    onRefresh: async () => {
      refresh();
      // Wait a bit so the user sees the spinner
      await new Promise(r => setTimeout(r, 800));
    },
  });

  const handleTabChange = useCallback((tab: Tab) => {
    // Save current scroll position
    scrollPositions.current[activeTab] = window.scrollY;

    // Double-tap Home: scroll to top + refresh
    if (tab === 'home' && activeTab === 'home') {
      const now = Date.now();
      if (now - lastHomeTap.current < 400) {
        // Double tap — refresh
        window.scrollTo({ top: 0, behavior: 'smooth' });
        refresh();
        lastHomeTap.current = 0;
        return;
      }
      lastHomeTap.current = now;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setActiveTab(tab);

    // Restore scroll position for the target tab
    requestAnimationFrame(() => {
      const saved = scrollPositions.current[tab] || 0;
      window.scrollTo({ top: saved });
    });
  }, [activeTab, refresh]);

  return (
    <main className="min-h-screen bg-stone-50 pb-20 md:pb-0">
      <TopBar />
      <PullRefreshIndicator pullDistance={pullDistance} refreshing={refreshing} pulling={pulling} />

      <div className={activeTab !== 'saved' ? 'block' : 'hidden'}>
        <Hero />
        <CategoryBar />
        <DealFeed />
      </div>

      <div className={activeTab === 'saved' ? 'block' : 'hidden'}>
        <SavedDeals />
      </div>

      <BackToTop />
      <AskWidget externalOpen={askOpen} onExternalClose={() => { setAskOpen(false); setAskInitialQuery(''); handleTabChange('home'); }} initialQuery={askInitialQuery} />
      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onSearchOpen={() => setSearchOpen(true)}
        onSearchClose={() => { setSearchOpen(false); handleTabChange('home'); }}
        onAskOpen={() => setAskOpen(true)}
        onAskClose={() => { setAskOpen(false); handleTabChange('home'); }}
      />
      <SearchOverlay
        open={searchOpen}
        onClose={() => { setSearchOpen(false); handleTabChange('home'); setSearch(''); }}
        onAskAI={(query) => {
          setSearchOpen(false);
          setSearch('');
          setAskInitialQuery(query);
          setAskOpen(true);
          handleTabChange('ask');
        }}
      />
    </main>
  );
}
