import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Rate limit: 3 submissions per IP per hour
const submissions = new Map<string, number[]>();
const RATE_LIMIT = 3;
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const times = (submissions.get(ip) || []).filter(t => now - t < RATE_WINDOW);
  if (times.length >= RATE_LIMIT) return true;
  times.push(now);
  submissions.set(ip, times);
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many submissions' }, { status: 429 });
    }

    const { type, message, email, website, ts } = await request.json();

    // Honeypot — bots fill hidden "website" field
    if (website) {
      return NextResponse.json({ success: true }); // fake success
    }

    // Time check — reject if submitted in under 2 seconds
    if (ts && Date.now() - ts < 2000) {
      return NextResponse.json({ success: true }); // fake success
    }

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (message.trim().length > 2000) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 });
    }

    await resend.emails.send({
      from: 'DXBSave <onboarding@resend.dev>',
      to: 'amer.sarhan@gmail.com',
      replyTo: email || undefined,
      subject: `[DXBSave] ${type}`,
      html: `
        <div style="font-family:-apple-system,sans-serif;max-width:560px;color:#1c1917;">
          <p style="font-size:12px;color:#a8a29e;margin:0 0 16px;">DXBSave — ${type}</p>
          <p style="font-size:16px;line-height:1.7;margin:0 0 24px;white-space:pre-wrap;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
          ${email ? `<p style="font-size:13px;color:#78716c;">Reply to: <a href="mailto:${email}" style="color:#1c1917;">${email}</a></p>` : ''}
          <hr style="border:none;border-top:1px solid #e7e5e4;margin:24px 0;">
          <p style="font-size:11px;color:#d6d3d1;">Sent from dxbsave.com · IP: ${ip}</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact error:', error);
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
  }
}
