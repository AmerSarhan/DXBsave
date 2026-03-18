import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Rate limit: 3 per IP per hour
const attempts = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const times = (attempts.get(ip) || []).filter(t => now - t < 3600000);
  if (times.length >= 3) return true;
  times.push(now);
  attempts.set(ip, times);
  return false;
}

// In-memory subscriber set (persists across warm function invocations)
// For production scale, move to Redis or a database
const subscribers = new Set<string>();

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });
    }

    const { email, hp } = await request.json();

    // Honeypot
    if (hp) return NextResponse.json({ success: true });

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const normalized = email.toLowerCase().trim();

    // Dedup
    if (subscribers.has(normalized)) {
      return NextResponse.json({ success: true, message: 'Already subscribed' });
    }
    subscribers.add(normalized);

    // Notify you
    await resend.emails.send({
      from: 'DXBSave <onboarding@resend.dev>',
      to: 'amer.sarhan@gmail.com',
      subject: `[DXBSave] New subscriber: ${normalized}`,
      html: `
        <div style="font-family:-apple-system,sans-serif;color:#1c1917;">
          <p style="font-size:16px;margin:0 0 8px;">New email subscriber:</p>
          <p style="font-size:20px;font-weight:bold;margin:0 0 16px;">${normalized}</p>
          <p style="font-size:12px;color:#a8a29e;">Total this session: ${subscribers.size}</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
