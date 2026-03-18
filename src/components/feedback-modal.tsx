'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const TYPES = ['Feedback', 'Submit a Deal', 'Report Issue'] as const;
type FeedbackType = (typeof TYPES)[number];

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
}

export function FeedbackModal({ open, onClose }: FeedbackModalProps) {
  const [type, setType] = useState<FeedbackType>('Feedback');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [openedAt] = useState(() => Date.now());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, message, email, website, ts: openedAt }),
      });
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setType('Feedback');
      setMessage('');
      setEmail('');
      setWebsite('');
      setSent(false);
    }, 300);
  };

  const placeholder =
    type === 'Submit a Deal' ? 'Venue, offer, price, link...' :
    type === 'Report Issue'  ? 'Which deal is wrong or expired?' :
    'Your message...';

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={handleClose}
            className="fixed inset-0 z-[70] bg-black/40"
          />

          {/* Sheet — bottom on mobile, centered dialog on desktop */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="fixed z-[70] inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center md:pointer-events-none"
          >
            <div className="bg-white rounded-t-[20px] md:rounded-2xl shadow-2xl overflow-hidden flex flex-col md:w-[460px] md:pointer-events-auto" style={{ maxHeight: '82vh' }}>

              {/* Handle (mobile only) */}
              <div className="md:hidden shrink-0 flex justify-center pt-3 pb-1">
                <div className="w-8 h-1 rounded-full bg-black/10" />
              </div>

              {/* Header */}
              <div className="shrink-0 px-5 pt-3 pb-4 flex items-center justify-between border-b border-stone-100">
                <h2 className="text-[17px] font-bold text-stone-900">Get in touch</h2>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-full bg-stone-100 active:scale-95 transition-transform duration-100"
                >
                  <X className="w-4 h-4 text-stone-600" />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-5 safe-bottom">
                {sent ? (
                  <div className="flex flex-col items-center py-8 gap-3">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                    <p className="text-[16px] font-semibold text-stone-900">Got it, thanks!</p>
                    <p className="text-[13px] text-stone-400 text-center">
                      We'll look into it and get back to you if needed.
                    </p>
                    <button
                      onClick={handleClose}
                      className="mt-2 px-6 py-2.5 bg-stone-900 text-white rounded-xl text-[14px] font-semibold active:scale-95 transition-transform duration-100"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {/* Type pills */}
                    <div className="flex gap-2 flex-wrap">
                      {TYPES.map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setType(t)}
                          className={cn(
                            'px-3 py-1.5 rounded-xl text-[13px] font-medium transition-colors duration-150',
                            type === t
                              ? 'bg-stone-900 text-white'
                              : 'bg-stone-100 text-stone-500 active:bg-stone-200'
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>

                    {/* Message */}
                    <textarea
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder={placeholder}
                      rows={4}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-[16px] md:text-[14px] text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300 resize-none"
                    />

                    {/* Email */}
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="Your email (optional, for reply)"
                      className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-[16px] md:text-[14px] text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300"
                    />

                    {/* Honeypot — invisible to humans, bots auto-fill it */}
                    <input
                      type="text"
                      value={website}
                      onChange={e => setWebsite(e.target.value)}
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                      className="absolute opacity-0 h-0 w-0 overflow-hidden pointer-events-none"
                    />

                    <button
                      type="submit"
                      disabled={!message.trim() || loading}
                      className="w-full flex items-center justify-center gap-2 py-3.5 bg-stone-900 text-white rounded-xl text-[14px] font-semibold disabled:opacity-40 active:scale-[0.97] transition-[transform,opacity] duration-150"
                    >
                      {loading
                        ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <><Send className="w-4 h-4" /> Send</>
                      }
                    </button>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
