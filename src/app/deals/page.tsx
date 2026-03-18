import { Metadata } from 'next';
import Link from 'next/link';
import Papa from 'papaparse';
import { SHEET_GIDS } from '@/lib/constants';

const month = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

export const metadata: Metadata = {
  title: `All UAE Deals & Offers ${month} | DXBSave`,
  description: `330+ verified UAE deals ${month} — hotel day passes from AED 100, happy hours from AED 17, free attractions, spa BOGO, delivery promo codes, and Eid specials. Updated daily.`,
};

const SHEET_BASE_URL = process.env.SHEET_CSV_BASE_URL || '';

interface Deal {
  name: string;
  category: string;
  emirate: string;
  offer: string;
  price: string;
}

const SHEETS: { key: string; label: string; gid: string; nameCol: number; emirateCol: number; offerCol: number; priceCol: number }[] = [
  { key: 'hotels', label: 'Hotels & Staycations', gid: SHEET_GIDS.hotels, nameCol: 0, emirateCol: 1, offerCol: 4, priceCol: 5 },
  { key: 'dining', label: 'Dining & Drinks', gid: SHEET_GIDS.dining, nameCol: 0, emirateCol: 1, offerCol: 4, priceCol: 7 },
  { key: 'attractions', label: 'Attractions & Events', gid: SHEET_GIDS.attractions, nameCol: 0, emirateCol: 1, offerCol: 4, priceCol: 5 },
  { key: 'delivery', label: 'Delivery & App Deals', gid: SHEET_GIDS.delivery, nameCol: 0, emirateCol: -1, offerCol: 3, priceCol: -1 },
  { key: 'spa', label: 'Spa & Wellness', gid: SHEET_GIDS.spa, nameCol: 0, emirateCol: 1, offerCol: 4, priceCol: 5 },
  { key: 'eid', label: 'Eid Specials', gid: SHEET_GIDS.eid, nameCol: 0, emirateCol: 2, offerCol: 3, priceCol: 4 },
];

async function fetchDeals(): Promise<Record<string, Deal[]>> {
  const result: Record<string, Deal[]> = {};

  await Promise.allSettled(
    SHEETS.map(async (sheet) => {
      try {
        const res = await fetch(`${SHEET_BASE_URL}${sheet.gid}`, { next: { revalidate: 3600 } });
        if (!res.ok) return;
        const csv = await res.text();
        const rows = Papa.parse<string[]>(csv, { skipEmptyLines: true }).data.slice(3);

        result[sheet.key] = rows
          .filter(row => row[sheet.nameCol]?.trim())
          .map(row => ({
            name: (row[sheet.nameCol] || '').trim(),
            category: sheet.label,
            emirate: sheet.emirateCol >= 0 ? (row[sheet.emirateCol] || '').trim() : 'UAE',
            offer: (row[sheet.offerCol] || '').trim(),
            price: sheet.priceCol >= 0 ? (row[sheet.priceCol] || '').trim() : '',
          }));
      } catch { /* skip */ }
    })
  );

  return result;
}

export default async function DealsPage() {
  const dealsByCategory = await fetchDeals();
  const allDeals = Object.values(dealsByCategory).flat();

  // Build ItemList JSON-LD for Google
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "UAE Deals & Offers",
    "description": "Verified deals across the UAE",
    "numberOfItems": allDeals.length,
    "itemListElement": allDeals.slice(0, 100).map((deal, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": deal.name,
      "description": deal.offer,
      ...(deal.price && { "offers": { "@type": "Offer", "price": deal.price.replace(/[^0-9.]/g, '') || '0', "priceCurrency": "AED" } }),
    })),
  };

  return (
    <main className="max-w-4xl mx-auto px-5 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <Link href="/" className="text-sm text-stone-400 hover:text-stone-600 transition-colors">
        &larr; Back to DXBSave
      </Link>

      <h1 className="text-3xl font-bold text-stone-900 mt-4 mb-2">
        All UAE Deals & Offers
      </h1>
      <p className="text-stone-500 mb-8">
        {allDeals.length}+ verified deals across hotels, dining, attractions, delivery, spa, and Eid specials. Updated daily.
      </p>

      {SHEETS.map((sheet) => {
        const deals = dealsByCategory[sheet.key];
        if (!deals?.length) return null;

        return (
          <section key={sheet.key} className="mb-10">
            <h2 className="text-xl font-semibold text-stone-800 mb-4 pb-2 border-b border-stone-200">
              {sheet.label}
              <span className="text-stone-400 text-sm font-normal ml-2">({deals.length})</span>
            </h2>
            <div className="space-y-3">
              {deals.map((deal, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-medium text-stone-800">{deal.name}</h3>
                    <p className="text-[13px] text-stone-500">
                      {[deal.emirate, deal.offer].filter(Boolean).join(' — ')}
                    </p>
                  </div>
                  {deal.price && (
                    <span className="text-[14px] font-semibold text-stone-700 shrink-0">
                      {deal.price.toLowerCase().includes('free') ? 'FREE' : `AED ${deal.price}`}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <footer className="text-center text-[12px] text-stone-400 mt-12 pt-6 border-t border-stone-100">
        Deals compiled by Dom from the Adtech Chat MENA WhatsApp Group.
        <br />
        <Link href="/" className="text-stone-500 hover:text-stone-700">dxbsave.com</Link>
      </footer>
    </main>
  );
}
