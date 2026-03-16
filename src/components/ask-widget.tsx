'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, MessageSquareText, MapPin, ChevronRight } from 'lucide-react';
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

const SUGGESTIONS = [
  'Free things to do',
  'Cheap dinners in Dubai',
  'Hotels under 300',
  'Eid specials',
];

function MiniDealCard({ deal, onTap }: { deal: DealResult; onTap: () => void }) {
  const config = CATEGORIES.find(c => c.key === deal.category);
  const isFree = deal.price.toLowerCase().includes('free');

  return (
    <button
      onClick={onTap}
      className="w-full text-left p-2.5 rounded-lg bg-white shadow-sm shadow-stone-200/50 hover:shadow-md active:scale-[0.98] transition-all flex items-start gap-2.5"
    >
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5', config?.bgColor || 'bg-stone-100')}>
        {config && <config.icon className={cn('w-3.5 h-3.5', config.color || 'text-stone-500')} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-stone-800 truncate">{deal.name}</p>
        {(deal.location || deal.emirate) && (
          <p className="text-[10px] text-stone-400 flex items-center gap-0.5 truncate">
            <MapPin className="w-2 h-2 shrink-0" />
            {[deal.location, deal.emirate].filter(Boolean).join(', ')}
          </p>
        )}
        <p className="text-[10px] text-stone-500 truncate mt-0.5">{deal.offer}</p>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-0.5">
        {deal.price && (
          <span className={cn('text-[12px] font-bold', isFree ? 'text-emerald-600' : 'text-stone-900')}>
            {isFree ? 'FREE' : (
              <span className="inline-flex items-center gap-0.5">
                <DirhamIcon className="w-2.5 h-2.5 opacity-50" />
                {deal.price.replace(/[^0-9,+]/g, '').trim() || deal.price}
              </span>
            )}
          </span>
        )}
        <ChevronRight className="w-3 h-3 text-stone-300" />
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
  const [openDeal, setOpenDeal] = useState<AnyDeal | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { allDeals } = useDeals();

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const findRealDeal = (dealResult: DealResult): AnyDeal | undefined => {
    return allDeals.find(d =>
      d.name.toLowerCase() === dealResult.name.toLowerCase() &&
      d.category === dealResult.category
    ) || allDeals.find(d =>
      d.name.toLowerCase().includes(dealResult.name.toLowerCase().slice(0, 20))
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

  return (
    <>
      {/* Floating trigger */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-20 right-5 z-40 flex items-center gap-2 px-4 py-2.5 bg-stone-900 text-white rounded-full shadow-lg shadow-stone-900/20 hover:bg-stone-800 active:scale-95 transition-all text-sm font-medium"
        >
          <MessageSquareText className="w-4 h-4" />
          Ask
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className={cn(
          'fixed z-50 bg-stone-50 overflow-hidden flex flex-col',
          // Mobile: full screen
          'inset-0 rounded-none',
          // Desktop: floating panel
          'sm:inset-auto sm:bottom-4 sm:right-4 sm:w-[360px] sm:rounded-2xl sm:shadow-2xl sm:shadow-stone-900/10 sm:border sm:border-stone-200/60'
        )} style={{ maxHeight: typeof window !== 'undefined' && window.innerWidth >= 640 ? 'min(560px, calc(100vh - 2rem))' : undefined }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 bg-white">
            <div className="flex items-center gap-2">
              <MessageSquareText className="w-4 h-4 text-stone-500" />
              <span className="text-[13px] font-semibold text-stone-700">Deal Finder</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-lg hover:bg-stone-100 transition-colors"
            >
              <X className="w-4 h-4 text-stone-400" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-[200px]">
            {messages.length === 0 && !loading && (
              <div className="text-center py-4">
                <MessageCircle className="w-8 h-8 mx-auto text-stone-200 mb-2" />
                <p className="text-[12px] text-stone-400 mb-3">Find deals across the UAE</p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-[11px] px-2.5 py-1.5 rounded-lg bg-white text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-colors shadow-sm shadow-stone-100"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i}>
                {m.role === 'user' ? (
                  <div className="max-w-[85%] ml-auto text-[13px] leading-relaxed px-3 py-2 rounded-xl bg-stone-900 text-white rounded-br-sm">
                    {m.content}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Text summary — short intro only */}
                    {m.content && (
                      <p className="text-[12px] text-stone-500 leading-relaxed px-1">
                        {m.content.split('\n')[0].replace(/\*\*/g, '').slice(0, 120)}
                        {m.content.length > 120 ? '...' : ''}
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
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="space-y-1.5 px-1">
                <Shimmer className="text-[12px]" duration={1.5} spread={2}>Searching deals across the UAE</Shimmer>
                <div className="space-y-1">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="p-2.5 rounded-lg bg-white shadow-sm shadow-stone-100 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-stone-100 animate-pulse" />
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
              <p className="text-[11px] text-red-400 text-center">{error}</p>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex items-center gap-2 px-3 py-2.5 border-t border-stone-100 bg-white"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about deals..."
              maxLength={500}
              className="flex-1 text-[13px] bg-transparent outline-none placeholder:text-stone-300 text-stone-700"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2 rounded-lg bg-stone-900 text-white disabled:opacity-30 hover:bg-stone-800 active:scale-95 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
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
