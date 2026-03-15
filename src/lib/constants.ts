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

export const SHEET_BASE_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTUOCxeVzPNaZosSkzwTPvuxM4in2XKBeBbYBMUbJiRCA6rCY5qeEkD8lWWZFO0PJfZeAIFc3HjRRz7/pub?output=csv&gid=';

export const SHEET_GIDS: Record<CategoryKey | 'tips', string> = {
  hotels: '824763207',
  dining: '136317990',
  attractions: '391522585',
  delivery: '1490714237',
  spa: '170977339',
  shopping: '1273501838',
  eid: '767741984',
  tips: '232251154',
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
