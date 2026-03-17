'use client';

import { Home, Search, Heart, MessageSquareText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDeals } from '@/contexts/deals-context';

type Tab = 'home' | 'saved' | 'search' | 'ask';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onSearchOpen: () => void;
  onSearchClose: () => void;
  onAskOpen: () => void;
  onAskClose: () => void;
}

export function BottomNav({ activeTab, onTabChange, onSearchOpen, onSearchClose, onAskOpen, onAskClose }: BottomNavProps) {
  const { favoriteDeals } = useDeals();

  const items = [
    {
      key: 'home' as const,
      icon: Home,
      label: 'Home',
      action: () => { onSearchClose(); onAskClose(); onTabChange('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); },
    },
    {
      key: 'search' as const,
      icon: Search,
      label: 'Search',
      action: () => { onAskClose(); onTabChange('search'); onSearchOpen(); },
    },
    {
      key: 'saved' as const,
      icon: Heart,
      label: 'Saved',
      badge: favoriteDeals.length || undefined,
      action: () => { onSearchClose(); onAskClose(); onTabChange('saved'); window.scrollTo({ top: 0 }); },
    },
    {
      key: 'ask' as const,
      icon: MessageSquareText,
      label: 'Ask',
      action: () => { onSearchClose(); onTabChange('ask'); onAskOpen(); },
    },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-2xl border-t border-stone-100 safe-bottom md:hidden">
      <div className="flex items-center justify-around px-2 pt-1.5 pb-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.key === activeTab;

          return (
            <button
              key={item.key}
              onClick={item.action}
              className="flex-1 flex flex-col items-center gap-0.5 py-1 relative touch-manipulation active:opacity-70 transition-opacity duration-100"
            >
              <div className="relative">
                <Icon
                  className={cn(
                    'w-[22px] h-[22px] transition-colors duration-150',
                    isActive ? 'text-stone-900' : 'text-stone-400'
                  )}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                {item.badge != null && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2.5 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={cn(
                'text-[10px] transition-colors duration-150',
                isActive ? 'font-semibold text-stone-900' : 'font-medium text-stone-400'
              )}>
                {item.label}
              </span>
              {/* Active indicator dot */}
              {isActive && (
                <div className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-stone-900" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
