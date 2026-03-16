'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, MessageSquareText, MapPin, ChevronRight, ArrowLeft, Flame, Tag, Building2, UtensilsCrossed, Ticket, Gift, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDeals } from '@/contexts/deals-context';
import { DealDetail } from './deal-detail';
import { DirhamIcon } from './dirham-icon';
import { Shimmer } from '@/components/ai-elements/shimmer';
import { AnyDeal } from '@/lib/types';
import { createPortal } from 'react-dom';
import { CATEGORIES } from '@/lib/constants';

interface DealResult {
  name: string;
  category: string;
  emirate: string;
  location: string;
  offer: string;
  price: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  deals?: DealResult[];
}

const QUICK_ACTIONS = [
  { label: 'Trending now', query: 'What are the most popular deals right now?', icon: TrendingUp },
  { label: 'Free stuff', query: 'Show me everything that is free', icon: Gift },
  { label: 'Hotels', query: 'Best hotel deals right now', icon: Building2 },
  { label: 'Dining', query: 'Best dining and happy hour deals', icon: UtensilsCrossed },
  { label: 'Eid deals', query: 'All Eid specials happening now', icon: Tag },
  { label: 'Attractions', query: 'Fun things to do and attractions', icon: Ticket },
];

const FOLLOW_UPS = [
  'Cheapest options?',
  'Anything in Abu Dhabi?',
  'What about Sharjah?',
  'Free things to do?',
  'Family-friendly?',
];

const LOADING_TEXTS = [
  'Checking every brunch in JBR...',
  'Asking the concierge at Atlantis...',
  'Negotiating with Sheikh Zayed Road traffic...',
  'Scanning happy hours at Dubai Marina...',
  'Racing through Mall of the Emirates...',
  'Checking if Aquaventure is still free...',
  'Counting dirhams so you don\'t have to...',
  'Haggling at the Gold Souk...',
  'Dodging supercar traffic on JBR walk...',
  'Refreshing the Entertainer app...',
  'Calling every hotel on Palm Jumeirah...',
  'Checking Talabat for promo codes...',
];

function MiniDealCard({ deal, onTap }: { deal: DealResult; onTap: () => void }) {
  const config = CATEGORIES.find(c => c.key === deal.category);
  const isFree = deal.price?.toLowerCase().includes('free') || deal.offer?.toLowerCase().includes('free');

  return (
    <button
      onClick={onTap}
      className="w-full text-left p-2.5 rounded-xl bg-white active:bg-stone-50 active:scale-[0.98] transition-all duration-150 flex items-start gap-2.5 touch-manipulation"
    >
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', config?.bgColor || 'bg-stone-100')}>
        {config ? <config.icon className={cn('w-4 h-4', config.color || 'text-stone-500')} /> : <Tag className="w-4 h-4 text-stone-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-stone-800 leading-tight">{deal.name}</p>
        {(deal.location || deal.emirate) && (
          <p className="text-[10px] text-stone-400 flex items-center gap-0.5 mt-0.5">
            <MapPin className="w-2.5 h-2.5 shrink-0" />
            <span className="truncate">{[deal.location, deal.emirate].filter(Boolean).join(', ')}</span>
          </p>
        )}
        <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">{deal.offer}</p>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-1 pt-0.5">
        {isFree ? (
          <span className="text-[12px] font-bold text-emerald-600">FREE</span>
        ) : deal.price ? (
          <span className="text-[13px] font-bold text-stone-900 inline-flex items-center gap-0.5">
            <DirhamIcon className="w-2.5 h-2.5 opacity-50" />
            {deal.price.replace(/[^0-9,+–-]/g, '').trim() || deal.price}
          </span>
        ) : null}
        <ChevronRight className="w-3.5 h-3.5 text-stone-300" />
      </div>
    </button>
  );
}

export function AskWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingText, setLoadingText] = useState('');
  const [openDeal, setOpenDeal] = useState<AnyDeal | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { allDeals } = useDeals();

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, loading, scrollToBottom]);

  const findRealDeal = (dealResult: DealResult): AnyDeal | undefined => {
    return allDeals.find(d =>
      d.name.toLowerCase() === dealResult.name.toLowerCase()
    ) || allDeals.find(d =>
      d.name.toLowerCase().includes(dealResult.name.toLowerCase().slice(0, 15))
    );
  };

  const handleDealTap = (dealResult: DealResult) => {
    const real = findRealDeal(dealResult);
    if (real) setOpenDeal(real);
  };

  const send = async (text: string) => {
    const msg = text.trim();
    if (!msg || loading) return;

    setInput('');
    setError('');
    setLoadingText(LOADING_TEXTS[Math.floor(Math.random() * LOADING_TEXTS.length)]);
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.reply,
          deals: data.deals || [],
        }]);
      }
    } catch {
      setError('Could not reach the server');
    } finally {
      setLoading(false);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <>
      {/* Floating trigger */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-20 right-5 z-40 flex items-center gap-2 px-4 py-2.5 bg-stone-900 text-white rounded-full shadow-lg shadow-stone-900/20 hover:bg-stone-800 active:scale-95 transition-all text-sm font-medium touch-manipulation"
        >
          <MessageSquareText className="w-4 h-4" />
          Ask
        </button>
      )}

      {/* Chat panel — full screen on mobile, floating on desktop */}
      {open && (
        <div className={cn(
          'fixed z-50 bg-stone-50 flex flex-col',
          'inset-0',
          'sm:inset-auto sm:bottom-4 sm:right-4 sm:w-[380px] sm:max-h-[min(600px,calc(100vh-2rem))] sm:rounded-2xl sm:shadow-2xl sm:shadow-stone-900/10 sm:border sm:border-stone-200/60'
        )}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 bg-white sm:rounded-t-2xl safe-top">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 -ml-1.5 rounded-lg hover:bg-stone-100 active:scale-95 transition-all sm:hidden touch-manipulation"
              >
                <ArrowLeft className="w-5 h-5 text-stone-500" />
              </button>
              <div>
                <span className="text-[14px] font-semibold text-stone-800 block">Deal Finder</span>
                <span className="text-[10px] text-stone-400">Powered by live deal data</span>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg hover:bg-stone-100 active:scale-95 transition-all hidden sm:block"
            >
              <X className="w-4 h-4 text-stone-400" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 space-y-4">
            {/* Empty state — rich quick actions */}
            {!hasMessages && !loading && (
              <div className="px-1">
                <p className="text-[13px] text-stone-500 mb-4">What are you looking for?</p>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => send(action.query)}
                      className="flex items-center gap-2.5 p-3 rounded-xl bg-white text-left active:scale-[0.97] active:bg-stone-50 transition-all duration-150 touch-manipulation shadow-sm shadow-stone-100"
                    >
                      <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
                        <action.icon className="w-4 h-4 text-stone-500" />
                      </div>
                      <span className="text-[12px] font-medium text-stone-700">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message history */}
            {messages.map((m, i) => (
              <div key={i}>
                {m.role === 'user' ? (
                  <div className="max-w-[80%] ml-auto text-[13px] leading-relaxed px-3.5 py-2.5 rounded-2xl rounded-br-md bg-stone-900 text-white">
                    {m.content}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* AI text — clean summary */}
                    {m.content && (
                      <p className="text-[13px] text-stone-600 leading-relaxed px-1">
                        {m.content.split('\n')[0].replace(/\*\*/g, '').slice(0, 150)}
                      </p>
                    )}
                    {/* Deal cards */}
                    {m.deals && m.deals.length > 0 && (
                      <div className="space-y-1.5">
                        {m.deals.map((d, j) => (
                          <MiniDealCard key={j} deal={d} onTap={() => handleDealTap(d)} />
                        ))}
                      </div>
                    )}
                    {/* Follow-up suggestions after response */}
                    {m.deals && m.deals.length > 0 && i === messages.length - 1 && !loading && (
                      <div className="flex gap-1.5 flex-wrap pt-1 px-1">
                        {FOLLOW_UPS.map((f) => (
                          <button
                            key={f}
                            onClick={() => send(f)}
                            className="text-[11px] px-2.5 py-1.5 rounded-full bg-white text-stone-500 active:bg-stone-100 active:scale-[0.97] transition-all touch-manipulation shadow-sm shadow-stone-100"
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Loading state */}
            {loading && (
              <div className="space-y-2 px-1">
                <Shimmer className="text-[12px]" duration={1.5} spread={2}>{loadingText}</Shimmer>
                <div className="space-y-1.5">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="p-2.5 rounded-xl bg-white flex items-center gap-2.5 shadow-sm shadow-stone-100">
                      <div className="w-9 h-9 rounded-lg bg-stone-100 animate-pulse" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-3/4 bg-stone-100 rounded animate-pulse" />
                        <div className="h-2 w-1/2 bg-stone-50 rounded animate-pulse" />
                      </div>
                      <div className="h-4 w-10 bg-stone-100 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="text-center py-2">
                <p className="text-[12px] text-red-400 mb-2">{error}</p>
                <button
                  onClick={() => { setError(''); if (messages.length) send(messages[messages.length - 1].content); }}
                  className="text-[11px] text-stone-500 underline"
                >
                  Try again
                </button>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="border-t border-stone-100 bg-white sm:rounded-b-2xl safe-bottom">
            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="flex items-center gap-2 px-3 py-3"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Search deals, ask anything..."
                maxLength={500}
                className="flex-1 text-[14px] bg-stone-50 rounded-xl px-3.5 py-2.5 outline-none placeholder:text-stone-300 text-stone-700 focus:ring-2 focus:ring-stone-200 transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2.5 rounded-xl bg-stone-900 text-white disabled:opacity-30 hover:bg-stone-800 active:scale-95 transition-all touch-manipulation"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Deal detail portal */}
      {openDeal && typeof document !== 'undefined' && createPortal(
        <DealDetail deal={openDeal} open={true} onClose={() => setOpenDeal(null)} />,
        document.body
      )}
    </>
  );
}
