import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(category: string, name: string, emirate: string, offer: string): string {
  const str = `${category}|${name}|${emirate}|${offer}`.toLowerCase();
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(36) + (h1 >>> 0).toString(36);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);
}

export function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.toLowerCase() === 'ongoing' || dateStr.trim() === '') {
    return null;
  }
  const cleaned = dateStr.replace(/\s+/g, ' ').trim();
  const date = new Date(cleaned);
  if (isNaN(date.getTime())) {
    // Try extracting date from strings like "Until Mar 22, 2026"
    const match = cleaned.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2},?\s*\d{4}/i);
    if (match) {
      const parsed = new Date(match[0]);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  }
  return date;
}

export function isExpiringSoon(date: Date | null): boolean {
  if (!date) return false;
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  return diff > 0 && diff <= sevenDays;
}

export function formatPrice(price: string): string {
  if (!price || price === '-' || price.toLowerCase() === 'free') {
    return price || '';
  }
  const num = parseFloat(price.replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return price;
  return `AED ${num.toLocaleString()}`;
}

export function extractNumericPrice(price: string): number {
  if (!price || price.toLowerCase() === 'free') return 0;
  const num = parseFloat(price.replace(/[^0-9.]/g, ''));
  return isNaN(num) ? Infinity : num;
}

export function generateWhatsAppUrl(deal: { name: string; offer: string; price: string; validUntil: string }, appUrl: string): string {
  const text = `Check out this deal!\n\n*${deal.name}*\n${deal.offer}\nPrice: ${deal.price}\nValid: ${deal.validUntil}\n\n${appUrl}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
