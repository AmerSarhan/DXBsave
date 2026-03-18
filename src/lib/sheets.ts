import Papa from 'papaparse';
import { generateId, slugify, parseDate, isExpiringSoon } from './utils';
import {
  CategoryKey,
  HotelDeal,
  DiningDeal,
  AttractionDeal,
  DeliveryDeal,
  SpaDeal,
  ShoppingDeal,
  EidDeal,
  MarketTip,
  AnyDeal,
} from './types';
import { SHEET_GIDS } from './constants';

// Skip header/description rows (first 2 rows are title + disclaimer)
function getDataRows(rows: string[][]): string[][] {
  // Find the header row - it's the first row where the first cell doesn't start with emoji or is purely text headers
  // Usually row index 2 (0=title, 1=sources, 2=headers, 3+=data)
  if (rows.length < 4) return [];
  return rows.slice(3); // skip title, sources, headers
}

function safeGet(row: string[], index: number): string {
  return (row[index] || '').trim();
}

export function parseHotels(csv: string): HotelDeal[] {
  const parsed = Papa.parse<string[]>(csv, { skipEmptyLines: true });
  const rows = getDataRows(parsed.data);
  return rows
    .filter(row => row[0] && row[0].trim().length > 0)
    .map((row, idx) => {
      const name = safeGet(row, 0);
      const emirate = safeGet(row, 1);
      const offer = safeGet(row, 4);
      const validUntil = safeGet(row, 10);
      const expiresAt = parseDate(validUntil);
      return {
        id: generateId('hotels', name, emirate, offer + idx),
        category: 'hotels' as const,
        name,
        emirate,
        location: safeGet(row, 2),
        tier: safeGet(row, 3),
        offer,
        price: safeGet(row, 5),
        normalRate: safeGet(row, 6),
        discount: safeGet(row, 7),
        inclusions: safeGet(row, 8),
        residentOnly: safeGet(row, 9).toLowerCase().startsWith('yes'),
        residentRequirement: safeGet(row, 9).replace(/^yes\s*[–-]\s*/i, '').trim(),
        validUntil,
        expiresAt,
        isExpiringSoon: isExpiringSoon(expiresAt),
        bookVia: safeGet(row, 11),
        notes: safeGet(row, 12),
        slug: `hotels-${slugify(name)}`,
      };
    });
}

export function parseDining(csv: string): DiningDeal[] {
  const parsed = Papa.parse<string[]>(csv, { skipEmptyLines: true });
  const rows = getDataRows(parsed.data);
  return rows
    .filter(row => row[0] && row[0].trim().length > 0)
    .map((row, idx) => {
      const name = safeGet(row, 0);
      const emirate = safeGet(row, 1);
      const offer = safeGet(row, 4);
      const validUntil = safeGet(row, 9);
      const expiresAt = parseDate(validUntil);
      return {
        id: generateId('dining', name, emirate, offer + idx),
        category: 'dining' as const,
        name,
        emirate,
        location: safeGet(row, 2),
        offerCategory: safeGet(row, 3),
        offer,
        days: safeGet(row, 5),
        timing: safeGet(row, 6),
        price: safeGet(row, 7),
        contact: safeGet(row, 8),
        validUntil,
        expiresAt,
        isExpiringSoon: isExpiringSoon(expiresAt),
        terms: safeGet(row, 10),
        isNew: safeGet(row, 11).toUpperCase() === 'YES' || safeGet(row, 11) === '✅',
        notes: '',
        slug: `dining-${slugify(name)}`,
      };
    });
}

export function parseAttractions(csv: string): AttractionDeal[] {
  const parsed = Papa.parse<string[]>(csv, { skipEmptyLines: true });
  const rows = getDataRows(parsed.data);
  return rows
    .filter(row => row[0] && row[0].trim().length > 0)
    .map((row, idx) => {
      const name = safeGet(row, 0);
      const emirate = safeGet(row, 1);
      const offer = safeGet(row, 4);
      const validUntil = safeGet(row, 6);
      const expiresAt = parseDate(validUntil);
      return {
        id: generateId('attractions', name, emirate, offer + idx),
        category: 'attractions' as const,
        name,
        emirate,
        location: safeGet(row, 2),
        offerCategory: safeGet(row, 3),
        offer,
        price: safeGet(row, 5),
        validUntil,
        expiresAt,
        isExpiringSoon: isExpiringSoon(expiresAt),
        booking: safeGet(row, 7),
        notes: safeGet(row, 8),
        slug: `attractions-${slugify(name)}`,
      };
    });
}

export function parseDelivery(csv: string): DeliveryDeal[] {
  const parsed = Papa.parse<string[]>(csv, { skipEmptyLines: true });
  const rows = getDataRows(parsed.data);
  return rows
    .filter(row => row[0] && row[0].trim().length > 0)
    .map((row, idx) => {
      const name = safeGet(row, 0);
      const emirate = 'UAE';
      const offer = safeGet(row, 3);
      const validUntil = safeGet(row, 5);
      const expiresAt = parseDate(validUntil);
      return {
        id: generateId('delivery', name, emirate, offer + idx),
        category: 'delivery' as const,
        name,
        emirate,
        location: '',
        platform: safeGet(row, 0),
        offerCategory: safeGet(row, 1),
        promoCode: safeGet(row, 2),
        offer,
        discount: safeGet(row, 3),
        price: '',
        minOrder: safeGet(row, 4),
        validUntil,
        expiresAt,
        isExpiringSoon: isExpiringSoon(expiresAt),
        terms: safeGet(row, 6),
        coverage: safeGet(row, 7),
        notes: safeGet(row, 8),
        slug: `delivery-${slugify(name + '-' + safeGet(row, 1))}`,
      };
    });
}

export function parseSpa(csv: string): SpaDeal[] {
  const parsed = Papa.parse<string[]>(csv, { skipEmptyLines: true });
  const rows = getDataRows(parsed.data);
  return rows
    .filter(row => row[0] && row[0].trim().length > 0)
    .map((row, idx) => {
      const name = safeGet(row, 0);
      const emirate = safeGet(row, 1);
      const offer = safeGet(row, 4);
      const validUntil = safeGet(row, 9);
      const expiresAt = parseDate(validUntil);
      return {
        id: generateId('spa', name, emirate, offer + idx),
        category: 'spa' as const,
        name,
        emirate,
        location: safeGet(row, 2),
        offerCategory: safeGet(row, 3),
        offer,
        price: safeGet(row, 5),
        normalPrice: safeGet(row, 6),
        discount: safeGet(row, 7),
        inclusions: safeGet(row, 8),
        validUntil,
        expiresAt,
        isExpiringSoon: isExpiringSoon(expiresAt),
        booking: safeGet(row, 10),
        notes: safeGet(row, 11),
        slug: `spa-${slugify(name)}`,
      };
    });
}

export function parseShopping(csv: string): ShoppingDeal[] {
  const parsed = Papa.parse<string[]>(csv, { skipEmptyLines: true });
  const rows = getDataRows(parsed.data);
  return rows
    .filter(row => row[0] && row[0].trim().length > 0)
    .map((row, idx) => {
      const name = safeGet(row, 0);
      const emirate = safeGet(row, 1);
      const offer = safeGet(row, 4) || safeGet(row, 3);
      const validUntil = safeGet(row, 5);
      const expiresAt = parseDate(validUntil);
      return {
        id: generateId('shopping', name, emirate, offer + idx),
        category: 'shopping' as const,
        name,
        emirate,
        location: safeGet(row, 2),
        offer,
        price: '',
        details: safeGet(row, 4),
        dates: safeGet(row, 5),
        validUntil,
        expiresAt,
        isExpiringSoon: isExpiringSoon(expiresAt),
        notes: safeGet(row, 6),
        slug: `shopping-${slugify(name)}`,
      };
    });
}

export function parseEid(csv: string): EidDeal[] {
  const parsed = Papa.parse<string[]>(csv, { skipEmptyLines: true });
  const rows = getDataRows(parsed.data);
  return rows
    .filter(row => row[0] && row[0].trim().length > 0)
    .map((row, idx) => {
      const name = safeGet(row, 0);      // Venue / Hotel / Attraction
      const offerCat = safeGet(row, 1);   // Category
      const emirate = safeGet(row, 2);    // Emirate
      const offer = safeGet(row, 3);      // Eid Offer Summary
      const validUntil = safeGet(row, 5); // When
      const expiresAt = parseDate(validUntil);
      return {
        id: generateId('eid', name, emirate, offer + idx),
        category: 'eid' as const,
        name,
        emirate,
        location: '',
        offerCategory: offerCat,
        offer,
        offerSummary: offer,
        price: safeGet(row, 4),
        validUntil,
        expiresAt,
        isExpiringSoon: isExpiringSoon(expiresAt),
        booking: safeGet(row, 6),
        status: safeGet(row, 7),
        notes: safeGet(row, 7),
        slug: `eid-${slugify(name)}`,
      };
    });
}

export function parseTips(csv: string): MarketTip[] {
  const parsed = Papa.parse<string[]>(csv, { skipEmptyLines: true });
  const rows = getDataRows(parsed.data);
  return rows
    .filter(row => row[0] && row[0].trim().length > 0)
    .map(row => ({
      tipNumber: safeGet(row, 0),
      category: safeGet(row, 1),
      title: safeGet(row, 2),
      details: safeGet(row, 3),
    }));
}

type ParserMap = {
  hotels: typeof parseHotels;
  dining: typeof parseDining;
  attractions: typeof parseAttractions;
  delivery: typeof parseDelivery;
  spa: typeof parseSpa;
  shopping: typeof parseShopping;
  eid: typeof parseEid;
  tips: typeof parseTips;
};

export const PARSERS: ParserMap = {
  hotels: parseHotels,
  dining: parseDining,
  attractions: parseAttractions,
  delivery: parseDelivery,
  spa: parseSpa,
  shopping: parseShopping,
  eid: parseEid,
  tips: parseTips,
};

export function getAllDeals(data: { hotels: HotelDeal[]; dining: DiningDeal[]; attractions: AttractionDeal[]; delivery: DeliveryDeal[]; spa: SpaDeal[]; shopping: ShoppingDeal[]; eid: EidDeal[] }): AnyDeal[] {
  return [
    ...data.hotels,
    ...data.dining,
    ...data.attractions,
    ...data.delivery,
    ...data.spa,
    ...data.shopping,
    ...data.eid,
  ];
}
