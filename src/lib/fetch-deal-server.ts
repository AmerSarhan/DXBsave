import { SHEET_GIDS } from './constants';
import {
  parseHotels, parseDining, parseAttractions,
  parseDelivery, parseSpa, parseShopping, parseEid,
} from './sheets';
import type { AnyDeal } from './types';

const SHEET_BASE_URL = process.env.SHEET_CSV_BASE_URL || '';

const PARSERS: Record<string, { gid: string; parse: (csv: string) => AnyDeal[] }> = {
  hotels:      { gid: SHEET_GIDS.hotels,      parse: parseHotels as (csv: string) => AnyDeal[] },
  dining:      { gid: SHEET_GIDS.dining,       parse: parseDining as (csv: string) => AnyDeal[] },
  attractions: { gid: SHEET_GIDS.attractions,  parse: parseAttractions as (csv: string) => AnyDeal[] },
  delivery:    { gid: SHEET_GIDS.delivery,     parse: parseDelivery as (csv: string) => AnyDeal[] },
  spa:         { gid: SHEET_GIDS.spa,          parse: parseSpa as (csv: string) => AnyDeal[] },
  shopping:    { gid: SHEET_GIDS.shopping,     parse: parseShopping as (csv: string) => AnyDeal[] },
  eid:         { gid: SHEET_GIDS.eid,          parse: parseEid as (csv: string) => AnyDeal[] },
};

export async function fetchDealBySlug(slug: string): Promise<AnyDeal | null> {
  const category = Object.keys(PARSERS).find(cat => slug.startsWith(`${cat}-`));
  if (!category) return null;

  const { gid, parse } = PARSERS[category];
  try {
    const res = await fetch(`${SHEET_BASE_URL}${gid}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const csv = await res.text();
    const deals = parse(csv);
    return deals.find(d => d.slug === slug) ?? null;
  } catch {
    return null;
  }
}
