// Deal Scout — Insert Test
// Takes results from deal-scout-test, maps to correct tabs, checks dupes, inserts
// Run: node scripts/deal-scout-insert-test.mjs

import { google } from 'googleapis';
import fs from 'fs';

const SHEET_ID = '15NNcYnWEbxhBj7ZMWSxuYGOMPnXwJSosu9hs8q4Dk6M';
const DRY_RUN = process.argv.includes('--dry-run');

// Column mapping per category
const SHEET_MAP = {
  hotels: {
    tab: '🏨 Hotels & Staycations',
    // A:Hotel Name, B:Emirate, C:Location, D:Tier, E:Offer/Deal, F:Rate, G:Normal Rate, H:Discount, I:Inclusions, J:Resident Only?, K:Valid Until, L:Book Via, M:Notes
    toRow: (d) => [
      d.name, d.emirate, d.location || '', d.tier || 'Deal',
      d.offer, d.price || '', '', '', '',
      'No', d.validUntil || 'Ongoing', d.sourceUrl || d.source || '',
      `Added by DXBSave Scout • ${d.source} • ${new Date().toISOString().split('T')[0]}`
    ],
  },
  dining: {
    tab: '🍽️ F&B Dining & Drinks',
    // A:Venue, B:Emirate, C:Location, D:Category, E:Offer Details, F:Day(s), G:Timing, H:Price, I:Contact, J:Valid Until, K:Terms, L:NEW?
    toRow: (d) => [
      d.name, d.emirate, d.location || '', d.subcategory || 'Deal',
      d.offer, d.days || 'Daily', d.timing || '', d.price || '',
      '', d.validUntil || 'Ongoing', '',
      'YES'
    ],
  },
  attractions: {
    tab: '🎡 Attractions & Events',
    // A:Attraction, B:Emirate, C:Location, D:Category, E:Offer/Deal, F:Price, G:Valid/Dates, H:Booking, I:Notes
    toRow: (d) => [
      d.name, d.emirate, d.location || '', d.subcategory || 'Attraction',
      d.offer, d.price || '', d.validUntil || 'Ongoing', '',
      `Added by DXBSave Scout • ${d.source}`
    ],
  },
  delivery: {
    tab: '📦 Delivery & App Deals',
    // A:Platform, B:Category, C:Promo Code, D:Discount/Deal, E:Min Order, F:Valid Until, G:Terms, H:Coverage, I:Notes
    toRow: (d) => [
      d.name, d.subcategory || 'Promo', d.promoCode || '', d.offer,
      '', d.validUntil || 'Ongoing', '', d.emirate || 'UAE',
      `Added by DXBSave Scout • ${d.source}`
    ],
  },
  spa: {
    tab: '💆 Spa, Wellness & Fitness',
    // A:Spa, B:Emirate, C:Location, D:Offer Type, E:Services, F:Price Range, G:Contact, H:Valid Until, I:Special Features
    toRow: (d) => [
      d.name, d.emirate, d.location || '', d.subcategory || 'Deal',
      d.offer, d.price || '', '', d.validUntil || 'Ongoing',
      `Added by DXBSave Scout • ${d.source}`
    ],
  },
  shopping: {
    tab: '🛍️ Shopping & Retail',
    // A:Sale/Event, B:Emirate, C:Category, D:Discount, E:Items, F:Dates, G:Terms, H:Highlights
    toRow: (d) => [
      d.name, d.emirate, d.subcategory || 'Sale', d.price || '',
      d.offer, d.validUntil || 'Ongoing', '',
      `Added by DXBSave Scout • ${d.source}`
    ],
  },
};

async function getAuth() {
  const key = JSON.parse(fs.readFileSync('D:/downloads/dxbsaveskey.json', 'utf8'));
  return new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

// Load existing venue names per tab for dedup
async function loadExistingPerTab(sheets) {
  const existing = {};
  for (const [cat, config] of Object.entries(SHEET_MAP)) {
    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `'${config.tab}'!A:A`,
      });
      const names = (res.data.values || [])
        .flat()
        .filter(Boolean)
        .map(n => n.toLowerCase().trim());
      existing[cat] = new Set(names);
    } catch {
      existing[cat] = new Set();
    }
  }
  return existing;
}

// Fuzzy match check
function isDuplicate(name, existingSet) {
  const lower = name.toLowerCase().trim();

  // Exact match
  if (existingSet.has(lower)) return true;

  // Substring match
  for (const existing of existingSet) {
    if (existing.includes(lower) || lower.includes(existing)) return true;
    // Word overlap
    const newWords = lower.split(/\s+/).filter(w => w.length > 3);
    const existWords = existing.split(/\s+/).filter(w => w.length > 3);
    if (newWords.length > 0) {
      const overlap = newWords.filter(w => existWords.includes(w)).length;
      if (overlap / newWords.length >= 0.6) return true;
    }
  }

  return false;
}

async function main() {
  // Load results from previous scrape
  if (!fs.existsSync('scripts/deal-scout-results.json')) {
    console.error('No results file. Run deal-scout-test.mjs first.');
    process.exit(1);
  }

  const results = JSON.parse(fs.readFileSync('scripts/deal-scout-results.json', 'utf8'));
  const deals = results.newDeals;
  console.log(`Loaded ${deals.length} deals from scout results\n`);

  const auth = await getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  // Load existing for dedup
  console.log('Loading existing deals for dedup...');
  const existing = await loadExistingPerTab(sheets);
  for (const [cat, set] of Object.entries(existing)) {
    console.log(`  ${cat}: ${set.size} existing`);
  }

  // Group deals by category and dedup
  const toInsert = {};
  const skipped = [];

  for (const deal of deals) {
    const cat = deal.category;
    if (!SHEET_MAP[cat]) {
      console.log(`  SKIP: Unknown category "${cat}" for ${deal.name}`);
      continue;
    }

    if (isDuplicate(deal.name, existing[cat])) {
      skipped.push(`${deal.name} (duplicate in ${cat})`);
      continue;
    }

    if (!toInsert[cat]) toInsert[cat] = [];
    toInsert[cat].push(deal);
  }

  console.log(`\nSkipped ${skipped.length} duplicates:`);
  skipped.forEach(s => console.log(`  - ${s}`));

  // Show what will be inserted
  const totalNew = Object.values(toInsert).flat().length;
  console.log(`\nReady to insert ${totalNew} new deals:\n`);

  for (const [cat, catDeals] of Object.entries(toInsert)) {
    const config = SHEET_MAP[cat];
    console.log(`  ${config.tab} (${catDeals.length} deals):`);
    for (const d of catDeals) {
      const row = config.toRow(d);
      console.log(`    + ${d.name} | ${d.price} | ${d.offer.substring(0, 50)}...`);
      if (!DRY_RUN) {
        // Find last row and append
        try {
          await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: `'${config.tab}'!A:A`,
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            requestBody: { values: [row] },
          });
          console.log(`      ✓ Inserted`);
        } catch (err) {
          console.log(`      ✗ Error: ${err.message}`);
        }
      }
    }
  }

  if (DRY_RUN) {
    console.log('\n(DRY RUN — nothing was written. Remove --dry-run to insert.)');
  } else {
    console.log(`\nDone. ${totalNew} deals inserted.`);
  }
}

main().catch(err => console.error('Fatal:', err));
