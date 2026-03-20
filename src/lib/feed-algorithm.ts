import type { AnyDeal, CategoryKey } from './types';
import { extractNumericPrice } from './utils';

// ─── Persistent memory stored in localStorage ────────────────────────────────

export interface FeedMemory {
  seenDeals: Record<string, number>;     // dealId → times shown in feed
  categoryTaps: Record<string, number>;  // category → user interaction count
  sectionOrder: CategoryKey[];           // last session's section order (for rotation penalty)
  sessionSeed: number;                   // random salt, refreshed each session
  visitCount: number;
  lastVisit: number;
}

export interface TrendingData {
  trending: Record<string, number>;
  topDeals: { id: string; taps: number }[];
}

export type DealWithScore = AnyDeal & {
  _score: number;
  _signals: {
    urgency: number;
    trending: number;
    value: number;
    novelty: number;
    timeRelevance: number;
    affinity: number;
    salt: number;
  };
  _heroReason: 'expiring' | 'trending' | 'free' | 'top' | null;
};

// ─── Time context ─────────────────────────────────────────────────────────────

export interface TimeContext {
  hour: number;
  isMorning: boolean;    // 6-12
  isAfternoon: boolean;  // 12-18
  isEvening: boolean;    // 18-02
  isWeekend: boolean;    // Fri-Sat (UAE weekend)
  isRamadanEidSeason: boolean; // March-April
}

export function getTimeContext(): TimeContext {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0=Sun,5=Fri,6=Sat
  const month = now.getMonth() + 1;
  return {
    hour,
    isMorning: hour >= 6 && hour < 12,
    isAfternoon: hour >= 12 && hour < 18,
    isEvening: hour >= 18 || hour < 2,
    isWeekend: day === 5 || day === 6,
    isRamadanEidSeason: month === 3 || month === 4,
  };
}

// ─── Individual signals (0-30 each) ──────────────────────────────────────────

function urgencyScore(deal: AnyDeal): number {
  if (!deal.expiresAt) return 2;
  const daysLeft = (deal.expiresAt.getTime() - Date.now()) / 864e5;
  if (daysLeft < 0)  return 0;
  if (daysLeft < 1)  return 30;
  if (daysLeft < 3)  return 25;
  if (daysLeft < 7)  return 18;
  if (daysLeft < 14) return 10;
  if (daysLeft < 30) return 5;
  return 2;
}

function trendingScore(
  deal: AnyDeal,
  taps: Record<string, number>,
  topIds: Set<string>,
): number {
  const t = taps[deal.id] || 0;
  if (topIds.has(deal.id) && t >= 10) return 25;
  if (topIds.has(deal.id))            return 18;
  if (t >= 5)  return 12;
  if (t >= 2)  return 7;
  if (t >= 1)  return 3;
  return 0;
}

function valueScore(deal: AnyDeal): number {
  const raw = (deal.price || '').toLowerCase().trim();
  if (!raw || raw === '-')      return 3;
  if (raw === 'free' || raw === '0') return 28;

  // Look for explicit discount field
  let pct = 0;
  if ('discount' in deal && typeof deal.discount === 'string') {
    const m = deal.discount.match(/(\d+)\s*%/);
    if (m) pct = parseInt(m[1]);
  }

  // Compare to original price if available
  if (pct === 0) {
    let normal = 0;
    if ('normalRate' in deal && typeof deal.normalRate === 'string')
      normal = extractNumericPrice(deal.normalRate);
    if ('normalPrice' in deal && typeof deal.normalPrice === 'string')
      normal = extractNumericPrice(deal.normalPrice);
    const current = extractNumericPrice(deal.price);
    if (normal > 0 && current > 0 && normal > current)
      pct = Math.round(((normal - current) / normal) * 100);
  }

  if (pct >= 50) return 22;
  if (pct >= 30) return 16;
  if (pct >= 15) return 10;
  if (pct > 0)   return 6;
  return 4;
}

function noveltyScore(deal: AnyDeal, seenDeals: Record<string, number>): number {
  const seen = seenDeals[deal.id] || 0;
  if (seen === 0) return 22;
  if (seen === 1) return 14;
  if (seen === 2) return 7;
  if (seen === 3) return 2;
  return 0; // pushed out of rotation after 4 views
}

function timeRelevanceScore(deal: AnyDeal, ctx: TimeContext): number {
  const cat = deal.category;
  const text = `${deal.offer} ${deal.name}`.toLowerCase();
  let score = 0;

  // UAE weekend (Fri-Sat): staycations, brunches, spa
  if (ctx.isWeekend) {
    if (cat === 'hotels')   score += 14;
    if (cat === 'spa')      score += 10;
    if (cat === 'eid')      score += 12;
    if (cat === 'dining' && (text.includes('brunch') || text.includes('friday') || text.includes('saturday')))
      score += 14;
    if (cat === 'attractions') score += 7;
  }

  // Morning 6-12
  if (ctx.isMorning) {
    if (cat === 'dining' && (text.includes('breakfast') || text.includes('brunch') || text.includes('morning')))
      score += 12;
    if (cat === 'attractions') score += 5;
    if (cat === 'delivery')    score += 5;
  }

  // Afternoon 12-18
  if (ctx.isAfternoon) {
    if (cat === 'attractions') score += 10;
    if (cat === 'spa')         score += 10;
    if (cat === 'hotels' && (text.includes('pool') || text.includes('day pass'))) score += 12;
    if (cat === 'dining' && (text.includes('happy hour') || text.includes('lunch'))) score += 8;
    if (cat === 'shopping')    score += 6;
  }

  // Evening 18-02
  if (ctx.isEvening) {
    if (cat === 'dining')   score += 12;
    if (cat === 'delivery') score += 10;
    if (cat === 'hotels' && !text.includes('day pass')) score += 6;
    if (cat === 'attractions' && (text.includes('night') || text.includes('fountain'))) score += 9;
  }

  // Ramadan/Eid season bonus
  if (ctx.isRamadanEidSeason) {
    if (cat === 'eid')    score += 20;
    if (cat === 'dining' && (text.includes('iftar') || text.includes('ramadan') || text.includes('eid')))
      score += 15;
  }

  return Math.min(score, 22);
}

function affinityScore(
  deal: AnyDeal,
  categoryTaps: Record<string, number>,
  favoriteIds: Set<string>,
): number {
  let score = 0;
  if (favoriteIds.has(deal.id)) score += 15;
  const taps = categoryTaps[deal.category] || 0;
  if (taps >= 6) score += 14;
  else if (taps >= 3) score += 9;
  else if (taps >= 1) score += 4;
  return Math.min(score, 20);
}

// Deterministic per-session salt so order differs each session but is stable within one
function saltScore(deal: AnyDeal, sessionSeed: number): number {
  const h = deal.id.split('').reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0);
  return ((sessionSeed ^ h) >>> 0) % 9;
}

// ─── Main scorer ──────────────────────────────────────────────────────────────

export function scoreDeals(
  deals: AnyDeal[],
  memory: FeedMemory,
  trendingData: TrendingData,
  favoriteIds: Set<string>,
): DealWithScore[] {
  const ctx = getTimeContext();
  const topIds = new Set(trendingData.topDeals.slice(0, 10).map(d => d.id));

  return deals.map(deal => {
    const urgency      = urgencyScore(deal);
    const trending     = trendingScore(deal, trendingData.trending, topIds);
    const value        = valueScore(deal);
    const novelty      = noveltyScore(deal, memory.seenDeals);
    const timeRelevance = timeRelevanceScore(deal, ctx);
    const affinity     = affinityScore(deal, memory.categoryTaps, favoriteIds);
    const salt         = saltScore(deal, memory.sessionSeed);

    const total = urgency + trending + value + novelty + timeRelevance + affinity + salt;

    // Hero reason: why this deal is in "Right Now"
    let heroReason: DealWithScore['_heroReason'] = null;
    if (urgency >= 25) heroReason = 'expiring';
    else if (trending >= 18) heroReason = 'trending';
    else if (value >= 28) heroReason = 'free';
    else if (total >= 70) heroReason = 'top';

    return {
      ...deal,
      _score: total,
      _signals: { urgency, trending, value, novelty, timeRelevance, affinity, salt },
      _heroReason: heroReason,
    };
  });
}

// ─── Section ordering ─────────────────────────────────────────────────────────

export function rankSections(
  memory: FeedMemory,
  trendingData: TrendingData,
  favoriteIds: Set<string>,
): CategoryKey[] {
  const all: CategoryKey[] = ['hotels', 'dining', 'attractions', 'delivery', 'spa', 'shopping', 'eid'];
  const ctx = getTimeContext();

  // Count trending taps per category
  const trendingByCategory: Record<string, number> = {};
  for (const [id, taps] of Object.entries(trendingData.trending)) {
    // We don't have category lookup here, rely on categoryTaps from memory
    void id; void taps;
  }

  const scores: Record<string, number> = {};

  for (const cat of all) {
    let s = 0;

    // User affinity
    const taps = memory.categoryTaps[cat] || 0;
    s += Math.min(taps * 4, 24);

    // Time of day
    if (ctx.isWeekend) {
      if (cat === 'hotels')   s += 16;
      if (cat === 'spa')      s += 12;
      if (cat === 'dining')   s += 10;
      if (cat === 'eid')      s += 14;
    }
    if (ctx.isMorning)   { if (cat === 'dining') s += 10; if (cat === 'delivery') s += 6; }
    if (ctx.isAfternoon) { if (cat === 'attractions') s += 12; if (cat === 'spa') s += 10; }
    if (ctx.isEvening)   { if (cat === 'dining') s += 14; if (cat === 'delivery') s += 12; }

    // Ramadan/Eid season
    if (ctx.isRamadanEidSeason && cat === 'eid') s += 22;

    // Rotation penalty — category that led last session gets pushed back
    const lastPos = memory.sectionOrder.indexOf(cat);
    if (lastPos === 0) s -= 18;
    else if (lastPos === 1) s -= 10;
    else if (lastPos === 2) s -= 5;
    else if (lastPos < 0) s += 6; // not seen recently

    // Deterministic salt
    const h = cat.split('').reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0);
    s += ((memory.sessionSeed ^ h) >>> 0) % 7;

    scores[cat] = s;
  }

  return [...all].sort((a, b) => scores[b] - scores[a]);
}

// ─── Hero "Right Now" selection ───────────────────────────────────────────────

export function selectHeroDeals(
  scored: DealWithScore[],
  count = 5,
): DealWithScore[] {
  // Candidates: expiring soon, trending, or free
  const candidates = scored.filter(d => d._heroReason !== null);

  if (candidates.length >= count) {
    return candidates
      .sort((a, b) =>
        (b._signals.urgency + b._signals.trending + b._signals.value) -
        (a._signals.urgency + a._signals.trending + a._signals.value)
      )
      .slice(0, count);
  }

  // Fallback to top-scoring deals
  return [...scored]
    .sort((a, b) => b._score - a._score)
    .slice(0, count);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getDefaultMemory(): FeedMemory {
  return {
    seenDeals: {},
    categoryTaps: {},
    sectionOrder: ['hotels', 'dining', 'attractions', 'delivery', 'spa', 'shopping', 'eid'],
    sessionSeed: Math.floor(Math.random() * 0xffffffff),
    visitCount: 0,
    lastVisit: Date.now(),
  };
}
