// Deal Scout — Test Script
// Scrapes real sources, parses with AI, dedupes against sheet, outputs results
// Run: node scripts/deal-scout-test.mjs

import { google } from 'googleapis';
import fs from 'fs';

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const SHEET_ID = '15NNcYnWEbxhBj7ZMWSxuYGOMPnXwJSosu9hs8q4Dk6M';

// Sources to scrape
const SOURCES = [
  {
    name: "What's On",
    url: 'https://whatson.ae/deals/',
    type: 'deals',
  },
  {
    name: 'Groupon UAE',
    url: 'https://www.groupon.ae/deals/dubai',
    type: 'deals',
  },
  {
    name: 'Visit Dubai',
    url: 'https://www.visitdubai.com/en/deals-and-offers',
    type: 'deals',
  },
  {
    name: 'The National',
    url: 'https://www.thenationalnews.com/lifestyle/',
    type: 'deals',
  },
];

// Step 1: Scrape sources
async function scrapeSource(source) {
  console.log(`  Scraping: ${source.name}...`);
  try {
    const res = await fetch(source.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.log(`    SKIP: HTTP ${res.status}`);
      return null;
    }
    const html = await res.text();
    // Strip HTML tags, keep text content (rough but works)
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 15000); // Cap at 15k chars for AI context
    console.log(`    Got ${text.length} chars of text`);
    return { ...source, text };
  } catch (err) {
    console.log(`    ERROR: ${err.message}`);
    return null;
  }
}

// Step 2: Parse with AI
async function parseDeals(scrapedSources) {
  console.log('\n2. Parsing with AI...');

  const combinedText = scrapedSources
    .map(s => `\n--- SOURCE: ${s.name} (${s.url}) ---\n${s.text}`)
    .join('\n\n');

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
          content: `You extract UAE deals from scraped web content. Only extract deals with SPECIFIC details (venue name, price or "free", what the offer is). Skip vague mentions or articles without concrete offers.

Return a JSON object: { "deals": [...] }

Each deal must have these exact fields:
- name: string (venue/hotel/restaurant name)
- emirate: string (Dubai, Abu Dhabi, Sharjah, etc.)
- location: string (area like JBR, Palm Jumeirah, etc. or empty)
- category: string (one of: hotels, dining, attractions, delivery, spa, shopping)
- offer: string (what the deal is - be specific)
- price: string (AED amount, "FREE", or "Varies")
- validUntil: string (date or "Ongoing")
- source: string (which publication)
- sourceUrl: string (URL of the source)

Only include deals you can extract with confidence from the provided text. Do NOT invent or guess deals.`
        },
        {
          role: 'user',
          content: `Extract all current UAE deals from this scraped content:\n\n${combinedText}`
        }
      ],
      max_tokens: 3000,
      temperature: 0.1,
    }),
  });

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    console.log('  ERROR: No AI response');
    return [];
  }

  try {
    // Extract JSON from response (might have markdown wrapping)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log('  ERROR: No JSON in response');
      console.log('  Raw:', content.substring(0, 200));
      return [];
    }
    const parsed = JSON.parse(jsonMatch[0]);
    const deals = parsed.deals || [];
    console.log(`  Found ${deals.length} deals from AI parsing`);
    return deals;
  } catch (err) {
    console.log(`  ERROR parsing AI response: ${err.message}`);
    console.log('  Raw:', content.substring(0, 300));
    return [];
  }
}

// Step 3: Load existing deals from sheet for dedup
async function loadExistingDeals() {
  console.log('\n3. Loading existing deals from sheet...');

  const key = JSON.parse(fs.readFileSync('D:/downloads/dxbsaveskey.json', 'utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  const sheetNames = [
    '🏨 Hotels & Staycations',
    '🍽️ F&B Dining & Drinks',
    '🎡 Attractions & Events',
    '📦 Delivery & App Deals',
    '💆 Spa, Wellness & Fitness',
    '🛍️ Shopping & Retail',
  ];

  const existingNames = new Set();

  for (const sheet of sheetNames) {
    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `'${sheet}'!A:A`,
      });
      const rows = res.data.values || [];
      for (const row of rows) {
        if (row[0]) existingNames.add(row[0].toLowerCase().trim());
      }
    } catch (err) {
      console.log(`  Warning: Could not read ${sheet}: ${err.message}`);
    }
  }

  console.log(`  Loaded ${existingNames.size} existing venue names`);
  return existingNames;
}

// Step 4: Dedup
function dedup(deals, existingNames) {
  console.log('\n4. Deduplicating...');

  const newDeals = [];
  const dupes = [];

  for (const deal of deals) {
    const name = deal.name?.toLowerCase().trim();
    if (!name) continue;

    // Check exact match
    if (existingNames.has(name)) {
      dupes.push(deal.name);
      continue;
    }

    // Check fuzzy — if any existing name contains this name or vice versa
    let isDupe = false;
    for (const existing of existingNames) {
      if (existing.includes(name) || name.includes(existing)) {
        dupes.push(`${deal.name} (fuzzy match: ${existing})`);
        isDupe = true;
        break;
      }
      // Simple word overlap check
      const dealWords = name.split(/\s+/).filter(w => w.length > 3);
      const existWords = existing.split(/\s+/).filter(w => w.length > 3);
      const overlap = dealWords.filter(w => existWords.includes(w)).length;
      if (dealWords.length > 0 && overlap / dealWords.length >= 0.6) {
        dupes.push(`${deal.name} (word overlap with: ${existing})`);
        isDupe = true;
        break;
      }
    }

    if (!isDupe) {
      newDeals.push(deal);
    }
  }

  console.log(`  New deals: ${newDeals.length}`);
  console.log(`  Duplicates skipped: ${dupes.length}`);
  if (dupes.length > 0) {
    console.log(`  Dupes: ${dupes.join(', ')}`);
  }

  return newDeals;
}

// Main
async function main() {
  console.log('=== Deal Scout Test ===\n');

  if (!OPENROUTER_KEY) {
    console.error('Missing OPENROUTER_API_KEY. Run: source .env.local');
    process.exit(1);
  }

  // Step 1: Scrape
  console.log('1. Scraping sources...');
  const scraped = [];
  for (const source of SOURCES) {
    const result = await scrapeSource(source);
    if (result) scraped.push(result);
  }

  if (scraped.length === 0) {
    console.log('\nNo sources could be scraped. Exiting.');
    return;
  }

  // Step 2: Parse with AI
  const deals = await parseDeals(scraped);

  if (deals.length === 0) {
    console.log('\nNo deals extracted. Exiting.');
    return;
  }

  // Step 3: Load existing
  const existingNames = await loadExistingDeals();

  // Step 4: Dedup
  const newDeals = dedup(deals, existingNames);

  // Output results
  console.log('\n=== RESULTS ===\n');

  if (newDeals.length === 0) {
    console.log('No new deals found (all duplicates of existing sheet data).');
  } else {
    console.log(`Found ${newDeals.length} NEW deals:\n`);
    for (const deal of newDeals) {
      console.log(`  ${deal.category.toUpperCase()} | ${deal.name}`);
      console.log(`    ${deal.emirate} - ${deal.location || 'N/A'}`);
      console.log(`    Offer: ${deal.offer}`);
      console.log(`    Price: ${deal.price}`);
      console.log(`    Valid: ${deal.validUntil}`);
      console.log(`    Source: ${deal.source}`);
      console.log('');
    }
  }

  // Save to file for review
  fs.writeFileSync('scripts/deal-scout-results.json', JSON.stringify({
    scrapedAt: new Date().toISOString(),
    sourcesScraped: scraped.length,
    totalExtracted: deals.length,
    newDeals: newDeals,
  }, null, 2));
  console.log('Full results saved to scripts/deal-scout-results.json');
}

main().catch(err => console.error('Fatal:', err));
