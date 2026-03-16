import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

const TAP_KEY = 'deal_taps';
const VIEWS_KEY = 'deal_views';

// GET — return top trending deals
export async function GET() {
  if (!redis) {
    return NextResponse.json({ trending: {}, topDeals: [] });
  }

  try {
    // Get all tap counts as a sorted set (top 20)
    const top = await redis.zrange(TAP_KEY, 0, 19, { rev: true, withScores: true });

    // Parse into { dealId: count } and ordered list
    const trending: Record<string, number> = {};
    const topDeals: { id: string; taps: number }[] = [];

    for (let i = 0; i < top.length; i += 2) {
      const id = top[i] as string;
      const score = top[i + 1] as number;
      trending[id] = score;
      topDeals.push({ id, taps: score });
    }

    return NextResponse.json({ trending, topDeals }, {
      headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate' },
    });
  } catch (error) {
    console.error('Trending GET error:', error);
    return NextResponse.json({ trending: {}, topDeals: [] });
  }
}

// POST — record a tap on a deal
export async function POST(request: NextRequest) {
  if (!redis) {
    return NextResponse.json({ ok: true });
  }

  let body: { dealId?: string; action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const dealId = body.dealId?.trim();
  if (!dealId || dealId.length > 50) {
    return NextResponse.json({ error: 'Invalid deal ID' }, { status: 400 });
  }

  try {
    // Increment tap count in sorted set
    await redis.zincrby(TAP_KEY, 1, dealId);

    // Track unique daily views with a HyperLogLog
    const today = new Date().toISOString().split('T')[0];
    await redis.pfadd(`${VIEWS_KEY}:${dealId}:${today}`, request.headers.get('x-forwarded-for') || 'anon');

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Trending POST error:', error);
    return NextResponse.json({ ok: true }); // fail silently — don't break the UX
  }
}
