'use client';

import { use, useEffect, useState } from 'react';
import { useDeals } from '@/contexts/deals-context';
import { TopBar } from '@/components/top-bar';
import { DealDetail } from '@/components/deal-detail';
import { DealCard } from '@/components/deal-card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function DealPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { getDealBySlug, loading, allDeals } = useDeals();
  const [detailOpen, setDetailOpen] = useState(false);

  const deal = getDealBySlug(slug);

  useEffect(() => {
    if (deal && !loading) {
      setDetailOpen(true);
    }
  }, [deal, loading]);

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <TopBar />
        <div className="pt-24 text-center text-neutral-400">
          <div className="animate-pulse">Loading deal...</div>
        </div>
      </main>
    );
  }

  if (!deal) {
    return (
      <main className="min-h-screen bg-white">
        <TopBar />
        <div className="pt-24 px-4 max-w-lg mx-auto text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Deal not found</h1>
          <p className="text-neutral-500 mb-6">This deal may have expired or been removed.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-neutral-900 text-white rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Browse all deals
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <TopBar />
      <div className="pt-20 px-4 max-w-7xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all deals
        </Link>
        <DealCard deal={deal} />
      </div>
      <DealDetail deal={deal} open={detailOpen} onClose={() => setDetailOpen(false)} />
    </main>
  );
}
