'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, MessageSquareText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'Best free things to do?',
  'Cheap dinner deals in Dubai?',
  'Hotel deals under 300 AED?',
  'Eid specials this week?',
];

export function AskWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

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
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
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
        <div className="fixed bottom-4 right-4 z-50 w-[340px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl shadow-stone-900/10 border border-stone-200/60 overflow-hidden flex flex-col" style={{ maxHeight: 'min(480px, calc(100vh - 2rem))' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 bg-stone-50">
            <div className="flex items-center gap-2">
              <MessageSquareText className="w-4 h-4 text-stone-500" />
              <span className="text-[13px] font-semibold text-stone-700">Deal Assistant</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-lg hover:bg-stone-200/60 transition-colors"
            >
              <X className="w-4 h-4 text-stone-400" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px]">
            {messages.length === 0 && !loading && (
              <div className="text-center py-4">
                <MessageCircle className="w-8 h-8 mx-auto text-stone-200 mb-2" />
                <p className="text-[12px] text-stone-400 mb-3">Ask about deals in the UAE</p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-[11px] px-2.5 py-1.5 rounded-lg bg-stone-50 text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  'max-w-[90%] text-[13px] leading-relaxed px-3 py-2.5 rounded-xl',
                  m.role === 'user'
                    ? 'ml-auto bg-stone-900 text-white rounded-br-sm'
                    : 'bg-stone-100 text-stone-700 rounded-bl-sm whitespace-pre-line'
                )}
              >
                {m.role === 'assistant'
                  ? m.content.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
                      part.startsWith('**') && part.endsWith('**')
                        ? <strong key={j} className="font-semibold text-stone-900">{part.slice(2, -2)}</strong>
                        : part
                    )
                  : m.content}
              </div>
            ))}

            {loading && (
              <div className="flex gap-1 px-3 py-2">
                <span className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}

            {error && (
              <p className="text-[11px] text-red-400 text-center">{error}</p>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex items-center gap-2 px-3 py-2.5 border-t border-stone-100"
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
    </>
  );
}
