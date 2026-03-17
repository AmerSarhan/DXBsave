import { NextRequest, NextResponse } from 'next/server';

const SHEET_BASE_URL = process.env.SHEET_CSV_BASE_URL || '';

const VALID_GIDS = new Set([
  '121077454', '1938135534', '595734893', '195924846',
  '264158510', '2136278522', '1267508469', '748122700',
]);

// Simple in-memory rate limiter: 30 requests per minute per IP
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW = 60_000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT) return true;
  return false;
}

// Cleanup stale entries every 5 minutes
if (typeof globalThis !== 'undefined') {
  const cleanup = () => {
    const now = Date.now();
    for (const [ip, entry] of rateMap) {
      if (now > entry.resetAt) rateMap.delete(ip);
    }
  };
  setInterval(cleanup, 5 * 60_000).unref?.();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gid: string }> }
) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  const { gid } = await params;

  if (!VALID_GIDS.has(gid)) {
    return NextResponse.json({ error: 'Invalid sheet ID' }, { status: 400 });
  }

  try {
    const response = await fetch(`${SHEET_BASE_URL}${gid}`, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error(`Google Sheets returned ${response.status}`);
    }

    const csv = await response.text();

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Cache-Control': 's-maxage=300, stale-while-revalidate',
      },
    });
  } catch (error) {
    console.error(`Failed to fetch sheet ${gid}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch sheet data' },
      { status: 502 }
    );
  }
}
