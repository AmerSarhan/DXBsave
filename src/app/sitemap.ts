import { MetadataRoute } from 'next';
import Papa from 'papaparse';
import { SHEET_GIDS, CATEGORIES, EMIRATES } from '@/lib/constants';
import { slugify } from '@/lib/utils';

const SHEET_BASE_URL = process.env.SHEET_CSV_BASE_URL || '';

const CATEGORY_SHEETS: { prefix: string; gid: string; nameCol: number }[] = [
  { prefix: 'hotels', gid: SHEET_GIDS.hotels, nameCol: 0 },
  { prefix: 'dining', gid: SHEET_GIDS.dining, nameCol: 0 },
  { prefix: 'attractions', gid: SHEET_GIDS.attractions, nameCol: 0 },
  { prefix: 'delivery', gid: SHEET_GIDS.delivery, nameCol: 0 },
  { prefix: 'spa', gid: SHEET_GIDS.spa, nameCol: 0 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: 'https://dxbsave.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://dxbsave.com/deals',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: 'https://dxbsave.com/ar',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    // Category pages
    ...CATEGORIES.map(c => ({
      url: `https://dxbsave.com/deals/${c.key}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    // Emirate pages
    ...EMIRATES.filter(e => e !== 'All').map(e => ({
      url: `https://dxbsave.com/deals/${slugify(e)}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
  ];

  // Fetch deal slugs for dynamic pages
  const dealPages: MetadataRoute.Sitemap = [];

  await Promise.allSettled(
    CATEGORY_SHEETS.map(async (sheet) => {
      try {
        const res = await fetch(`${SHEET_BASE_URL}${sheet.gid}`, { next: { revalidate: 86400 } });
        if (!res.ok) return;
        const csv = await res.text();
        const rows = Papa.parse<string[]>(csv, { skipEmptyLines: true }).data.slice(3);

        for (const row of rows) {
          const name = (row[sheet.nameCol] || '').trim();
          if (!name) continue;
          const slug = `${sheet.prefix}-${slugify(name)}`;
          dealPages.push({
            url: `https://dxbsave.com/deal/${slug}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.6,
          });
        }
      } catch { /* skip */ }
    })
  );

  return [...staticPages, ...dealPages];
}
