import { Metadata } from 'next';
import Link from 'next/link';
import Papa from 'papaparse';
import { SHEET_GIDS, CATEGORIES, EMIRATES } from '@/lib/constants';
import { slugify } from '@/lib/utils';

const SHEET_BASE_URL = process.env.SHEET_CSV_BASE_URL || '';

// All valid slugs for categories and emirates
const CATEGORY_SLUGS = CATEGORIES.map(c => c.key);
const EMIRATE_SLUGS = EMIRATES.filter(e => e !== 'All').map(e => slugify(e));

const SHEETS = [
  { key: 'hotels', label: 'Hotels & Staycations', gid: SHEET_GIDS.hotels, nameCol: 0, emirateCol: 1, offerCol: 4, priceCol: 5 },
  { key: 'dining', label: 'Dining & Drinks', gid: SHEET_GIDS.dining, nameCol: 0, emirateCol: 1, offerCol: 4, priceCol: 7 },
  { key: 'attractions', label: 'Attractions & Events', gid: SHEET_GIDS.attractions, nameCol: 0, emirateCol: 1, offerCol: 4, priceCol: 5 },
  { key: 'delivery', label: 'Delivery & App Deals', gid: SHEET_GIDS.delivery, nameCol: 0, emirateCol: -1, offerCol: 3, priceCol: -1 },
  { key: 'spa', label: 'Spa & Wellness', gid: SHEET_GIDS.spa, nameCol: 0, emirateCol: 1, offerCol: 4, priceCol: 5 },
  { key: 'shopping', label: 'Shopping & Retail', gid: SHEET_GIDS.shopping, nameCol: 0, emirateCol: 1, offerCol: 4, priceCol: -1 },
];

interface Deal {
  name: string;
  category: string;
  categoryKey: string;
  emirate: string;
  offer: string;
  price: string;
}

function findEmirate(slug: string): string | null {
  const emirate = EMIRATES.find(e => slugify(e) === slug && e !== 'All');
  return emirate || null;
}

function findCategory(slug: string): (typeof SHEETS)[number] | null {
  return SHEETS.find(s => s.key === slug) || null;
}

async function fetchAllDeals(): Promise<Deal[]> {
  const all: Deal[] = [];
  await Promise.allSettled(
    SHEETS.map(async (sheet) => {
      try {
        const res = await fetch(`${SHEET_BASE_URL}${sheet.gid}`, { next: { revalidate: 3600 } });
        if (!res.ok) return;
        const csv = await res.text();
        const rows = Papa.parse<string[]>(csv, { skipEmptyLines: true }).data.slice(3);
        for (const row of rows) {
          const name = (row[sheet.nameCol] || '').trim();
          if (!name) continue;
          all.push({
            name,
            category: sheet.label,
            categoryKey: sheet.key,
            emirate: sheet.emirateCol >= 0 ? (row[sheet.emirateCol] || '').trim() : 'UAE',
            offer: (row[sheet.offerCol] || '').trim(),
            price: sheet.priceCol >= 0 ? (row[sheet.priceCol] || '').trim() : '',
          });
        }
      } catch { /* skip */ }
    })
  );
  return all;
}

export async function generateStaticParams() {
  return [
    ...CATEGORY_SLUGS.map(slug => ({ slug })),
    ...EMIRATE_SLUGS.map(slug => ({ slug })),
  ];
}

function currentMonth(): string {
  return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const emirate = findEmirate(slug);
  const category = findCategory(slug);
  const month = currentMonth();

  const emirateDescriptions: Record<string, string> = {
    'Dubai': `Best Dubai deals ${month} — hotel day passes from AED 100, happy hours from AED 17, free attractions, spa BOGO offers, and delivery promo codes.`,
    'Abu Dhabi': `Abu Dhabi deals ${month} — staycation packages, restaurant discounts, free museum entry, and spa treatments. Updated daily.`,
    'Sharjah': `Sharjah deals ${month} — affordable hotels, dining discounts, family attractions, and shopping sales. Verified and updated daily.`,
    'Ajman': `Ajman deals ${month} — beach resorts, dining offers, and local attractions at the best prices in the UAE.`,
    'Ras Al Khaimah': `Ras Al Khaimah deals ${month} — adventure activities, mountain resorts, spa getaways, and dining offers. Updated daily.`,
    'Fujairah': `Fujairah deals ${month} — beach hotels, diving experiences, mountain escapes, and dining offers on the east coast.`,
    'Umm Al Quwain': `Umm Al Quwain deals ${month} — affordable staycations, water parks, and family-friendly offers.`,
  };

  const categoryDescriptions: Record<string, string> = {
    'hotels': `UAE hotel deals ${month} — day passes from AED 100, staycations with up to 25% off, seasonal packages, and resident-only rates across Dubai, Abu Dhabi, and more.`,
    'dining': `UAE restaurant deals ${month} — happy hours from AED 17, ladies nights, brunches from AED 150, and dining specials across Dubai and Abu Dhabi.`,
    'attractions': `UAE attractions deals ${month} — FREE entry offers, theme park discounts, concert tickets, and family activities across Dubai, Abu Dhabi, and Sharjah.`,
    'delivery': `UAE delivery promo codes ${month} — Deliveroo, Talabat, Careem, and Noon Food discounts. Verified and working codes updated daily.`,
    'spa': `UAE spa and wellness deals ${month} — BOGO treatments, hammam packages, fitness memberships, and ladies day specials at top hotel spas.`,
    'shopping': `UAE shopping sales ${month} — seasonal sales up to 80% off, mall promotions, and outlet deals across Dubai and Abu Dhabi.`,
  };

  if (emirate) {
    const desc = emirateDescriptions[emirate] || `Best deals and offers in ${emirate}, UAE — hotels, dining, attractions, spa, and more. Updated daily.`;
    return {
      title: `${emirate} Deals & Offers ${month} | DXBSave`,
      description: desc,
      openGraph: {
        title: `${emirate} Deals & Offers`,
        description: desc,
        url: `https://dxbsave.com/deals/${slug}`,
      },
    };
  }

  if (category) {
    const desc = categoryDescriptions[category.key] || `Best ${category.label.toLowerCase()} deals across the UAE. Updated daily.`;
    return {
      title: `${category.label} Deals UAE ${month} | DXBSave`,
      description: desc,
      openGraph: {
        title: `${category.label} Deals UAE`,
        description: desc,
        url: `https://dxbsave.com/deals/${slug}`,
      },
    };
  }

  return { title: 'Deals | DXBSave' };
}

export default async function FilteredDealsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const emirate = findEmirate(slug);
  const category = findCategory(slug);
  const allDeals = await fetchAllDeals();

  let filtered: Deal[];
  let title: string;
  let description: string;

  if (emirate) {
    filtered = allDeals.filter(d => d.emirate.toLowerCase() === emirate.toLowerCase());
    title = `${emirate} Deals & Offers`;
    description = `${filtered.length}+ verified deals in ${emirate} across hotels, dining, attractions, spa, and more.`;
  } else if (category) {
    filtered = allDeals.filter(d => d.categoryKey === category.key);
    title = `${category.label} Deals`;
    description = `${filtered.length}+ verified ${category.label.toLowerCase()} deals across the UAE.`;
  } else {
    filtered = allDeals;
    title = 'All Deals';
    description = `${filtered.length}+ deals across the UAE.`;
  }

  // Group by category for display
  const grouped: Record<string, Deal[]> = {};
  for (const deal of filtered) {
    if (!grouped[deal.category]) grouped[deal.category] = [];
    grouped[deal.category].push(deal);
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": title,
    "description": description,
    "numberOfItems": filtered.length,
    "itemListElement": filtered.slice(0, 100).map((deal, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": deal.name,
      "description": deal.offer,
      ...(deal.price && { "offers": { "@type": "Offer", "price": deal.price.replace(/[^0-9.]/g, '') || '0', "priceCurrency": "AED" } }),
    })),
  };


  return (
    <main className="max-w-4xl mx-auto px-5 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Link href="/deals" className="text-sm text-stone-400 hover:text-stone-600 transition-colors">
        &larr; All Deals
      </Link>

      <h1 className="text-3xl font-bold text-stone-900 mt-4 mb-2">{title}</h1>
      <p className="text-stone-500 mb-8">{description} Updated daily.</p>

      {Object.entries(grouped).map(([cat, deals]) => (
        <section key={cat} className="mb-10">
          <h2 className="text-xl font-semibold text-stone-800 mb-4 pb-2 border-b border-stone-200">
            {cat}
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
      ))}

      <footer className="text-center text-[12px] text-stone-400 mt-12 pt-6 border-t border-stone-100">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-4">
          {EMIRATES.filter(e => e !== 'All').map(e => (
            <Link key={e} href={`/deals/${slugify(e)}`} className="hover:text-stone-600 transition-colors">{e}</Link>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-4">
          {SHEETS.map(s => (
            <Link key={s.key} href={`/deals/${s.key}`} className="hover:text-stone-600 transition-colors">{s.label}</Link>
          ))}
        </div>
        <Link href="/" className="text-stone-500 hover:text-stone-700">dxbsave.com</Link>
      </footer>
    </main>
  );
}
