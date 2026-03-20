import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const SHEET_ID = process.env.GOOGLE_SHEET_ID || '';
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || '';
const CRON_SECRET = process.env.CRON_SECRET || '';
const REVIEW_TAB = '🤖 For Review';

const SOURCES = [
  { name: "What's On", url: 'https://whatson.ae/deals/' },
  { name: 'Groupon UAE', url: 'https://www.groupon.ae/deals/dubai' },
  { name: 'Visit Dubai', url: 'https://www.visitdubai.com/en/deals-and-offers' },
  { name: 'The National', url: 'https://www.thenationalnews.com/lifestyle/' },
];

function getAuth() {
  const keyBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '';
  if (!keyBase64) return null;
  const key = JSON.parse(Buffer.from(keyBase64, 'base64').toString('utf8'));
  return new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

// Extract plain text from HTML without using regex on HTML structure
function htmlToText(html: string): string {
  let result = '';
  let i = 0;
  const len = html.length;
  while (i < len) {
    if (html[i] === '<') {
      const sliceLower = html.slice(i, i + 7).toLowerCase();
      if (sliceLower.startsWith('<script')) {
        const endIdx = html.toLowerCase().indexOf('</script>', i);
        i = endIdx !== -1 ? endIdx + 9 : len;
        continue;
      }
      if (sliceLower.startsWith('<style')) {
        const endIdx = html.toLowerCase().indexOf('</style>', i);
        i = endIdx !== -1 ? endIdx + 8 : len;
        continue;
      }
      const endTag = html.indexOf('>', i);
      i = endTag !== -1 ? endTag + 1 : len;
      result += ' ';
    } else {
      result += html[i];
      i++;
    }
  }
  return result.replace(/\s+/g, ' ').trim();
}

// Scrape a source URL
async function scrape(source: { name: string; url: string }): Promise<string | null> {
  try {
    const res = await fetch(source.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    return htmlToText(html).substring(0, 15000);
  } catch {
    return null;
  }
}

// Extract deals with AI
async function extractDeals(scrapedText: string): Promise<Array<Record<string, string>>> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://dxbsave.com',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        {
          role: 'system',
          content: `Extract CURRENT UAE deals from scraped web content. Today is ${new Date().toISOString().split('T')[0]}. Only include deals that are clearly active RIGHT NOW — skip anything expired, undated from old articles, or without a specific offer. Each deal must have a SPECIFIC venue name, price or discount, and concrete offer details. For validUntil: use the actual expiry date if mentioned (YYYY-MM-DD), "Ongoing" only if explicitly stated, otherwise leave empty. Return JSON: { "deals": [{ "name", "emirate", "location", "category" (hotels/dining/attractions/delivery/spa/shopping), "offer", "price", "validUntil", "source", "sourceUrl" }] }. Skip vague mentions and anything that looks old or undated.`,
        },
        { role: 'user', content: `Extract deals:\n\n${scrapedText}` },
      ],
      max_tokens: 3000,
      temperature: 0.1,
    }),
  });

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) return [];

  try {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return [];
    return JSON.parse(match[0]).deals || [];
  } catch {
    return [];
  }
}

// Load existing names from all live tabs + review tab for dedup
async function loadExistingNames(sheets: ReturnType<typeof google.sheets>): Promise<Set<string>> {
  const allTabs = [
    '🏨 Hotels & Staycations',
    '🍽️ F&B Dining & Drinks',
    '🎡 Attractions & Events',
    '📦 Delivery & App Deals',
    '💆 Spa, Wellness & Fitness',
    '🛍️ Shopping & Retail',
    REVIEW_TAB,
  ];

  const names = new Set<string>();

  for (const tab of allTabs) {
    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `'${tab}'!A:A`,
      });
      for (const row of res.data.values || []) {
        if (row[0]) names.add(row[0].toLowerCase().trim());
      }
    } catch {
      // Tab might not exist
    }
  }

  return names;
}

function isDuplicate(name: string, existing: Set<string>): boolean {
  const lower = name.toLowerCase().trim();
  if (existing.has(lower)) return true;

  for (const ex of existing) {
    if (ex.includes(lower) || lower.includes(ex)) return true;
    const newWords = lower.split(/\s+/).filter(w => w.length > 3);
    const exWords = ex.split(/\s+/).filter(w => w.length > 3);
    if (newWords.length > 0) {
      const overlap = newWords.filter(w => exWords.includes(w)).length;
      if (overlap / newWords.length >= 0.6) return true;
    }
  }

  return false;
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const auth = getAuth();
  if (!auth || !SHEET_ID || !OPENROUTER_KEY) {
    return NextResponse.json({ error: 'Missing config' }, { status: 503 });
  }

  const sheets = google.sheets({ version: 'v4', auth });
  const today = new Date().toISOString().split('T')[0];

  // 1. Scrape sources
  const scrapedParts: string[] = [];
  for (const source of SOURCES) {
    const text = await scrape(source);
    if (text && text.length > 100) {
      scrapedParts.push(`\n--- SOURCE: ${source.name} (${source.url}) ---\n${text}`);
    }
  }

  if (scrapedParts.length === 0) {
    return NextResponse.json({ message: 'No sources available', deals: 0 });
  }

  // 2. Extract deals with AI
  const deals = await extractDeals(scrapedParts.join('\n\n'));

  if (deals.length === 0) {
    return NextResponse.json({ message: 'No deals extracted', deals: 0 });
  }

  // 2b. Drop deals with expired validUntil dates
  const now = new Date();
  const freshDeals = deals.filter(d => {
    if (!d.validUntil || d.validUntil === 'Ongoing') return true;
    const expiry = new Date(d.validUntil);
    return isNaN(expiry.getTime()) || expiry >= now;
  });

  // 3. Load existing names (from ALL tabs including review tab)
  const existing = await loadExistingNames(sheets);

  // 4. Dedup and insert new deals into review tab
  let inserted = 0;
  const skipped: string[] = [];

  for (const deal of freshDeals) {
    if (!deal.name) continue;

    if (isDuplicate(deal.name, existing)) {
      skipped.push(deal.name);
      continue;
    }

    // Add to review tab
    // Columns: Name, Emirate, Location, Category, Offer, Price, ValidUntil, Source, SourceURL, FoundDate, Status
    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `'${REVIEW_TAB}'!A:K`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [[
            deal.name,
            deal.emirate || '',
            deal.location || '',
            deal.category || '',
            deal.offer || '',
            deal.price || '',
            deal.validUntil || 'Ongoing',
            deal.source || '',
            deal.sourceUrl || '',
            today,
            'Pending',
          ]],
        },
      });
      inserted++;
      // Add to existing set so next deals in same batch don't duplicate
      existing.add(deal.name.toLowerCase().trim());
    } catch {
      // Skip on error
    }
  }

  return NextResponse.json({
    message: `Scout complete`,
    sourcesScraped: scrapedParts.length,
    dealsFound: deals.length,
    expired: deals.length - freshDeals.length,
    inserted,
    skipped: skipped.length,
    skippedNames: skipped,
  });
}
