import { NextRequest, NextResponse } from 'next/server';

const SHEET_BASE_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTUOCxeVzPNaZosSkzwTPvuxM4in2XKBeBbYBMUbJiRCA6rCY5qeEkD8lWWZFO0PJfZeAIFc3HjRRz7/pub?output=csv&gid=';

const VALID_GIDS = new Set([
  '824763207', '136317990', '391522585', '1490714237',
  '170977339', '1273501838', '767741984', '232251154',
]);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gid: string }> }
) {
  const { gid } = await params;

  if (!VALID_GIDS.has(gid)) {
    return NextResponse.json({ error: 'Invalid sheet ID' }, { status: 400 });
  }

  try {
    const response = await fetch(`${SHEET_BASE_URL}${gid}`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
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
