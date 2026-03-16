import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import { SHEET_GIDS } from '@/lib/constants';
import { CategoryKey } from '@/lib/types';

// --- Rate limiting ---
const rateMap = new Map<string, { count: number; resetAt: number }>();
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  entry.count++;
  return entry.count > 10;
}

// --- Deal data cache ---
interface DealRow { name: string; category: string; emirate: string; location: string; offer: string; price: string }
let dealCache: { rows: DealRow[]; fetchedAt: number } | null = null;
const CACHE_TTL = 10 * 60_000;

const SHEET_BASE_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSUm8ZCBVCcdUoub21h_fppYUhhlviwK_g9crhKAk34rT9bJXgwgdGJ81EPaaJ9Uw/pub?output=csv&gid=';

const SHEET_CONFIGS: { key: string; gid: string; nameCol: number; offerCol: number; priceCol: number; locationCol: number; emirateCol: number }[] = [
  { key: 'hotels', gid: SHEET_GIDS.hotels, nameCol: 0, offerCol: 4, priceCol: 5, locationCol: 2, emirateCol: 1 },
  { key: 'dining', gid: SHEET_GIDS.dining, nameCol: 0, offerCol: 4, priceCol: 7, locationCol: 2, emirateCol: 1 },
  { key: 'attractions', gid: SHEET_GIDS.attractions, nameCol: 0, offerCol: 4, priceCol: 5, locationCol: 2, emirateCol: 1 },
  { key: 'delivery', gid: SHEET_GIDS.delivery, nameCol: 0, offerCol: 3, priceCol: -1, locationCol: -1, emirateCol: -1 },
  { key: 'spa', gid: SHEET_GIDS.spa, nameCol: 0, offerCol: 4, priceCol: 5, locationCol: 2, emirateCol: 1 },
  { key: 'shopping', gid: SHEET_GIDS.shopping, nameCol: 0, offerCol: 4, priceCol: -1, locationCol: 2, emirateCol: 1 },
  { key: 'eid', gid: SHEET_GIDS.eid, nameCol: 0, offerCol: 3, priceCol: 4, locationCol: -1, emirateCol: 2 },
];

async function getAllDeals(): Promise<DealRow[]> {
  if (dealCache && Date.now() - dealCache.fetchedAt < CACHE_TTL) return dealCache.rows;

  const allRows: DealRow[] = [];
  await Promise.allSettled(
    SHEET_CONFIGS.map(async (cfg) => {
      try {
        const res = await fetch(`${SHEET_BASE_URL}${cfg.gid}`, { next: { revalidate: 600 } });
        if (!res.ok) return;
        const csv = await res.text();
        const rows = Papa.parse<string[]>(csv, { skipEmptyLines: true }).data.slice(3);
        for (const row of rows) {
          const name = (row[cfg.nameCol] || '').trim();
          if (!name) continue;
          allRows.push({
            name,
            category: cfg.key,
            emirate: cfg.emirateCol >= 0 ? (row[cfg.emirateCol] || '').trim() : 'UAE',
            location: cfg.locationCol >= 0 ? (row[cfg.locationCol] || '').trim() : '',
            offer: cfg.offerCol >= 0 ? (row[cfg.offerCol] || '').trim() : '',
            price: cfg.priceCol >= 0 ? (row[cfg.priceCol] || '').trim() : '',
          });
        }
      } catch { /* skip */ }
    })
  );

  dealCache = { rows: allRows, fetchedAt: Date.now() };
  return allRows;
}

// --- Tool definitions ---
const tools = [
  {
    type: 'function' as const,
    function: {
      name: 'search_deals',
      description: 'Search for deals by keyword across all categories. Use for general queries like "pool", "brunch", "free entry", venue names, etc.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search keyword (venue name, deal type, activity, etc.)' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_deals_by_category',
      description: 'Get all deals in a specific category.',
      parameters: {
        type: 'object',
        properties: {
          category: { type: 'string', enum: ['hotels', 'dining', 'attractions', 'delivery', 'spa', 'shopping', 'eid'], description: 'Deal category' },
          max_results: { type: 'number', description: 'Max deals to return (default 10)' },
        },
        required: ['category'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_deals_by_emirate',
      description: 'Get deals in a specific emirate/city.',
      parameters: {
        type: 'object',
        properties: {
          emirate: { type: 'string', description: 'Emirate name (Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, Fujairah)' },
          category: { type: 'string', enum: ['hotels', 'dining', 'attractions', 'delivery', 'spa', 'shopping', 'eid'], description: 'Optional category filter' },
          max_results: { type: 'number', description: 'Max deals to return (default 10)' },
        },
        required: ['emirate'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_free_deals',
      description: 'Get all deals that are free or have free entry.',
      parameters: {
        type: 'object',
        properties: {
          max_results: { type: 'number', description: 'Max deals to return (default 10)' },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_cheapest_deals',
      description: 'Get the cheapest deals, optionally filtered by category.',
      parameters: {
        type: 'object',
        properties: {
          category: { type: 'string', enum: ['hotels', 'dining', 'attractions', 'spa'], description: 'Optional category filter' },
          max_price: { type: 'number', description: 'Maximum price in AED' },
          max_results: { type: 'number', description: 'Max deals to return (default 10)' },
        },
      },
    },
  },
];

// --- Tool execution ---
function formatDeal(d: DealRow): string {
  const parts = [`**${d.name}**`];
  if (d.location || d.emirate) parts.push(`${[d.location, d.emirate].filter(Boolean).join(', ')}`);
  if (d.offer) parts.push(d.offer);
  if (d.price) parts.push(`AED ${d.price}`);
  return parts.join(' — ');
}

function extractPrice(p: string): number {
  if (!p || p.toLowerCase().includes('free')) return 0;
  const m = p.match(/(\d[\d,]*)/);
  return m ? parseFloat(m[1].replace(/,/g, '')) : Infinity;
}

async function executeTool(name: string, args: Record<string, unknown>): Promise<string> {
  const deals = await getAllDeals();
  const max = (args.max_results as number) || 10;

  switch (name) {
    case 'search_deals': {
      const q = (args.query as string).toLowerCase();
      const results = deals.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.offer.toLowerCase().includes(q) ||
        d.location.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q)
      ).slice(0, max);
      return results.length ? results.map(formatDeal).join('\n') : 'No deals found for that search.';
    }
    case 'get_deals_by_category': {
      const cat = args.category as string;
      return deals.filter(d => d.category === cat).slice(0, max).map(formatDeal).join('\n') || 'No deals in that category.';
    }
    case 'get_deals_by_emirate': {
      const emirate = (args.emirate as string).toLowerCase();
      const cat = args.category as string | undefined;
      let filtered = deals.filter(d => d.emirate.toLowerCase().includes(emirate));
      if (cat) filtered = filtered.filter(d => d.category === cat);
      return filtered.slice(0, max).map(formatDeal).join('\n') || 'No deals found in that emirate.';
    }
    case 'get_free_deals': {
      const free = deals.filter(d =>
        d.price.toLowerCase().includes('free') || d.offer.toLowerCase().includes('free')
      ).slice(0, max);
      return free.length ? free.map(formatDeal).join('\n') : 'No free deals found right now.';
    }
    case 'get_cheapest_deals': {
      const cat = args.category as string | undefined;
      const maxPrice = (args.max_price as number) || Infinity;
      let filtered = deals.filter(d => {
        const p = extractPrice(d.price);
        return p > 0 && p < Infinity && p <= maxPrice;
      });
      if (cat) filtered = filtered.filter(d => d.category === cat);
      filtered.sort((a, b) => extractPrice(a.price) - extractPrice(b.price));
      return filtered.slice(0, max).map(formatDeal).join('\n') || 'No deals found in that price range.';
    }
    default:
      return 'Unknown tool.';
  }
}

// --- Main handler ---
const SYSTEM_PROMPT = `You are DXBsave's deal finder. You help users discover specific deals across the UAE.

You have tools to search the live deals database. USE THEM for every question — never guess or make up deals.

Rules:
- Always call a tool before answering. Never respond without data.
- Present deals clearly: bold venue name, location, offer, price.
- Keep answers concise — list the deals, add a one-line suggestion if relevant.
- If the user asks in Arabic, respond in Arabic.
- Never invent deals. Only share what the tools return.`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'AI assistant is not configured' }, { status: 503 });
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip') || 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests. Try again in a minute.' }, { status: 429 });
  }

  let body: { message?: string };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message || message.length > 500) {
    return NextResponse.json({ error: 'Message must be 1-500 characters' }, { status: 400 });
  }

  const messages: Array<Record<string, unknown>> = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: message },
  ];

  try {
    // Agentic loop: max 3 iterations
    for (let i = 0; i < 3; i++) {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://dxbsave.com',
          'X-Title': 'DXBSave',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-preview',
          messages,
          tools,
          max_tokens: 600,
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        console.error('OpenRouter error:', response.status);
        return NextResponse.json({ error: 'AI is temporarily unavailable' }, { status: 502 });
      }

      const data = await response.json();
      const choice = data.choices?.[0];
      const assistantMsg = choice?.message;

      if (!assistantMsg) {
        return NextResponse.json({ error: 'No response from AI' }, { status: 502 });
      }

      // If model wants to call tools
      if (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
        messages.push(assistantMsg);

        for (const toolCall of assistantMsg.tool_calls) {
          const fnName = toolCall.function.name;
          let fnArgs: Record<string, unknown> = {};
          try { fnArgs = JSON.parse(toolCall.function.arguments); } catch { /* empty args */ }

          const result = await executeTool(fnName, fnArgs);
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: result,
          });
        }
        continue; // next iteration — model will now respond with the data
      }

      // Model is done — return the final text
      const reply = assistantMsg.content?.trim();
      if (!reply) {
        return NextResponse.json({ error: 'Empty response' }, { status: 502 });
      }
      return NextResponse.json({ reply });
    }

    return NextResponse.json({ error: 'Could not complete the request' }, { status: 500 });
  } catch (error) {
    console.error('Ask API error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
