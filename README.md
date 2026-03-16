# DXBSave

A mobile-first web app for discovering the latest deals and offers across the UAE. Hotels, dining, attractions, delivery codes, spa, shopping, and Eid specials — all in one place, updated live from a curated Google Sheet.

**Live:** [dxbsave.com](https://dxbsave.com)

## How It Works

The app fetches data live from a published Google Sheet via CSV export. A Next.js API route proxies the requests server-side to avoid CORS, parses the CSV with PapaParse, and returns typed JSON. The client fetches all 7 category sheets in parallel on load.

The sheet maintainer updates deals in Google Sheets. The app reflects changes within 5 minutes (server-side cache TTL). No redeployment needed.

```
Google Sheets (CSV) → Next.js API Route → PapaParse → React Context → UI
```

## Categories

| Category | Sheet | Deals |
|----------|-------|-------|
| Hotels & Staycations | Day passes, overnight deals | 96 |
| F&B Dining & Drinks | Happy hours, ladies nights, brunches, iftars | 73 |
| Attractions & Events | Theme parks, concerts, free entry offers | 28 |
| Delivery & App Deals | Promo codes for Deliveroo, Talabat, Careem | 24 |
| Spa, Wellness & Fitness | BOGO deals, hotel spas | 24 |
| Shopping & Retail | Eid sales, seasonal events | 10 |
| Eid Specials | Cross-category Eid deals | 31 |

## Features

- **Live data** from Google Sheets — no database, no CMS
- **Search** across all fields (venue, offer, location, inclusions)
- **Filter** by emirate (Dubai, Abu Dhabi, Sharjah, etc.) and category
- **Sort** by price or expiring soon
- **Favorites** saved in localStorage — no account needed
- **Share** via WhatsApp or native share sheet, with deep links to individual deals
- **Promo code copy** — one tap for delivery app codes
- **Expiring soon** badges on deals within 7 days of expiry
- **Dirham currency symbol** with smart price formatting (handles FREE, ranges, "from" prices)
- **AI deal assistant** — ask questions about deals, powered by OpenRouter (server-side only, key never in client)
- **Responsive** — single column on mobile, 3-column grid on desktop
- **Slide-out deal panel** — full deal details in a right-side panel (desktop) or full-screen (mobile)

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router) |
| UI | shadcn/ui + Tailwind CSS v4 |
| Icons | Lucide React |
| Animation | Framer Motion |
| CSV Parsing | PapaParse |
| State | React Context |
| AI | OpenRouter (Gemini 2.0 Flash) |
| Analytics | Google Analytics 4 |
| Deployment | Vercel |

## Project Structure

```
src/
  app/
    api/
      sheets/[gid]/route.ts     # Server-side CSV proxy with rate limiting
      ask/route.ts               # AI assistant endpoint (server-side only)
    deal/[slug]/page.tsx         # Deep link deal page
    favorites/page.tsx           # Saved deals
    layout.tsx                   # Root layout, metadata, GA, SEO
    page.tsx                     # Homepage
  components/
    top-bar.tsx                  # Sticky nav with search + favorites
    hero.tsx                     # Headline + rotating spotlight cards
    category-bar.tsx             # Horizontal category pills
    filter-bar.tsx               # Emirate filters + sort
    deal-card.tsx                # Horizontal deal card with icon strip
    deal-feed.tsx                # Responsive deal grid
    deal-detail.tsx              # Slide-out detail panel
    search-overlay.tsx           # Full-screen search
    ask-widget.tsx               # AI deal assistant chat widget
    back-to-top.tsx              # Scroll-to-top button
    dirham-icon.tsx              # UAE Dirham currency symbol
  hooks/
    use-sheet-data.ts            # Fetch + parse all CSV sheets
    use-favorites.ts             # localStorage favorites
  contexts/
    deals-context.tsx            # Global state, filters, search
  lib/
    types.ts                     # TypeScript interfaces per category
    constants.ts                 # GID map, category config, emirate list
    sheets.ts                    # CSV parsers per category
    utils.ts                     # Date parsing, slug generation, hashing
```

## Running Locally

```bash
npm install
npm run dev
```

Open [localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `NEXT_PUBLIC_SITE_URL` | Base URL for OG meta and deep links | No (defaults to `https://dxbsave.com`) |
| `OPENROUTER_API_KEY` | AI assistant (server-side only, never in client) | No (assistant disabled if missing) |

## Security

- API keys are server-side only — no `NEXT_PUBLIC_` prefix, never in the client bundle
- Both API routes (`/api/sheets`, `/api/ask`) are rate limited per IP
- Google Sheets URL is only in the server-side API route
- `bookVia` URLs are validated (must be `https://` or phone number format)
- All user input is sanitized and length-capped

## Data Source

The Google Sheet has 7 data tabs plus a summary dashboard and market tips. Each tab has its own column schema. The app skips the first 3 rows of each sheet (title, sources disclaimer, headers) and parses from row 4 onward.

Sheet GID mapping is in `src/lib/constants.ts`. Parsers are in `src/lib/sheets.ts`.

To use a different Google Sheet: update the `SHEET_BASE_URL` in the API route and `SHEET_GIDS` in constants, then update the parser functions to match your column layout.

## Credits

Deals compiled by **Dom** from the **Adtech Chat MENA** WhatsApp Group.

## License

MIT
