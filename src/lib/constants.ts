import {
  Building2,
  UtensilsCrossed,
  Ticket,
  Package,
  Sparkles,
  ShoppingBag,
  Moon,
  type LucideIcon,
} from 'lucide-react';
import { CategoryKey } from './types';

export const SHEET_GIDS: Record<CategoryKey | 'tips', string> = {
  hotels: '121077454',
  dining: '1938135534',
  attractions: '595734893',
  delivery: '195924846',
  spa: '264158510',
  shopping: '2136278522',
  eid: '1267508469',
  tips: '748122700',
};

export interface CategoryConfig {
  key: CategoryKey;
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

export const CATEGORIES: CategoryConfig[] = [
  { key: 'hotels', label: 'Hotels', icon: Building2, color: 'text-slate-600', bgColor: 'bg-slate-100' },
  { key: 'dining', label: 'Dining', icon: UtensilsCrossed, color: 'text-amber-700', bgColor: 'bg-amber-50' },
  { key: 'attractions', label: 'Attractions', icon: Ticket, color: 'text-teal-700', bgColor: 'bg-teal-50' },
  { key: 'delivery', label: 'Delivery', icon: Package, color: 'text-zinc-600', bgColor: 'bg-zinc-100' },
  { key: 'spa', label: 'Spa & Wellness', icon: Sparkles, color: 'text-rose-700', bgColor: 'bg-rose-50' },
  { key: 'shopping', label: 'Shopping', icon: ShoppingBag, color: 'text-stone-600', bgColor: 'bg-stone-100' },
  { key: 'eid', label: 'Eid Specials', icon: Moon, color: 'text-indigo-700', bgColor: 'bg-indigo-50' },
];

export const EMIRATES = ['All', 'Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'];

export const STALE_TIME_MS = 5 * 60 * 1000; // 5 minutes
