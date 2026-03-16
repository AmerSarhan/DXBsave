import { NextRequest, NextResponse } from 'next/server';

// Rate limiter: 10 requests per minute per IP
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

// Cleanup stale entries
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateMap) {
      if (now > entry.resetAt) rateMap.delete(ip);
    }
  }, 5 * 60_000).unref?.();
}

const SYSTEM_PROMPT = `You are DXBsave's deal assistant. You help users find the best deals across the UAE.

You have knowledge about these deal categories:
- Hotels & Staycations: day passes, overnight deals across Dubai, Abu Dhabi, Sharjah, RAK
- Dining: happy hours, ladies nights, brunches, iftars
- Attractions: theme parks, free entry offers, concerts, events
- Delivery: promo codes for Deliveroo, Talabat, Careem, Noon Food
- Spa & Wellness: BOGO deals, hotel spas
- Shopping: Eid sales, seasonal events
- Eid Specials: cross-category Eid Al Fitr deals

Rules:
- Keep answers concise (2-3 sentences max)
- Suggest specific deal categories or filters the user should check
- If asked about a specific deal, tell them to search for it on the site
- Never make up specific prices or deals — direct them to browse
- Be helpful and friendly, use a casual tone
- Respond in the same language the user writes in`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'AI assistant is not configured' },
      { status: 503 }
    );
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Try again in a minute.' },
      { status: 429 }
    );
  }

  let body: { message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message || message.length > 500) {
    return NextResponse.json(
      { error: 'Message must be 1-500 characters' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://dxbsave.com',
        'X-Title': 'DXBSave',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: message },
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('OpenRouter error:', response.status);
      return NextResponse.json(
        { error: 'AI is temporarily unavailable' },
        { status: 502 }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 502 }
      );
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Ask API error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
