# DXBSave

Mobile-first deals platform for the UAE. Browse 330+ verified offers across hotels, dining, attractions, delivery, spa, shopping, and Eid specials. Data pulls live from a Google Sheet, no backend needed.

**[dxbsave.com](https://dxbsave.com)**

## How It Works

```
Google Sheets (CSV) -> Next.js API Route -> PapaParse -> React Context -> UI
```

Someone updates the Google Sheet. The app picks it up within 5 minutes. No redeploy, no database, no CMS.

The API route fetches CSV server-side (avoids CORS), parses it, and returns typed JSON. All 7 category sheets load in parallel on first visit.

## Features

**Browse**
- 7 deal categories with live counts
- Filter by emirate (Dubai, Abu Dhabi, Sharjah, RAK, Ajman, Fujairah, UAQ)
- Sort by price or expiring soon
- Paginated feed (24 at a time, no scroll jank)
- Trending badges powered by Upstash Redis
- Residents-only badge on hotel deals requiring Emirates ID / GCC ID

**Search**
- Full-text search across all fields (venue, offer, location)
- Quick search chips (Pool, Brunch, Happy Hour, Eid, etc.)
- Trending deals shown on empty search
- Results grouped by category with tappable cards

**Deal Details**
- Slide-up panel on mobile, centered panel on desktop
- Smart price display with Dirham symbol (handles FREE, ranges, "from" prices)
- Book Now / Call to Book actions
- WhatsApp share with pre-formatted message
- Related deals from same category + emirate
- Residents-only eligibility details (Emirates ID, GCC ID, etc.)

**AI Deal Finder**
- Natural language search ("hotels under 300", "free things in Dubai")
- Gemini 3 Flash via OpenRouter with tool calling
- 5 tools: search, category, emirate, free deals, cheapest
- Returns tappable deal cards, not text walls
- Contextual loading messages ("Haggling at the Gold Souk...")
- Full-screen on mobile, floating panel on desktop

**Daily Deal Scout**
- Automated cron job runs daily at 5 AM
- Scrapes 4 UAE deal sources (What's On, Groupon, Visit Dubai, The National)
- AI-powered deal extraction with structured parsing
- Fuzzy deduplication against all existing tabs (60% word overlap)
- New deals written to "For Review" sheet tab for manual approval

**Contact & Feedback**
- Bottom sheet on mobile, centered dialog on desktop
- Submit a deal, report an issue, or send feedback
- Email delivery via Resend
- Spam protection: honeypot field, time gate, rate limiting

**Favorites**
- Tap heart to save, stored in localStorage
- No account needed, works offline
- Dedicated /favorites page

**Trending**
- Every deal tap records to Upstash Redis
- Top 20 most-tapped deals get trending badge
- View count shown per deal
- HyperLogLog for daily unique visitors per deal

**SEO**
- Server-rendered /deals page with all deal data (Google can crawl it)
- sitemap.xml and robots.txt
- Full OG metadata with custom share image
- Twitter card support
- Google Analytics 4

## Tech Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Icons | Lucide React |
| Animation | Framer Motion |
| CSV Parsing | PapaParse |
| State | React Context + useReducer |
| AI | OpenRouter (Gemini 3 Flash, tool calling) |
| Email | Resend |
| Trending | Upstash Redis (sorted sets + HyperLogLog) |
| Analytics | Vercel Analytics + Google Analytics 4 |
| Hosting | Vercel |

## Project Structure

```
src/
  app/
    api/
      sheets/[gid]/route.ts     Server-side CSV proxy, rate limited
      ask/route.ts               AI assistant with tool calling
      trending/route.ts          Redis tap tracking + trending
      contact/route.ts           Feedback form, Resend email, spam protection
      cron/scout/route.ts        Daily deal scraper + AI parser
    deals/page.tsx               Server-rendered SEO page
    deal/[slug]/page.tsx         Deep link to specific deal
    favorites/page.tsx           Saved deals
    sitemap.ts                   Dynamic sitemap
    robots.ts                    Crawler rules
    layout.tsx                   Root layout, metadata, GA
    page.tsx                     Homepage

  components/
    top-bar.tsx                  Sticky nav, animated logo, feedback + favorites
    hero.tsx                     Headline, rotating spotlight cards, credits
    category-bar.tsx             Categories + emirates + sort (single sticky row)
    deal-card.tsx                Horizontal card with icon strip, price display
    deal-feed.tsx                Paginated grid with shimmer loading
    deal-detail.tsx              Slide-up (mobile) / centered panel (desktop)
    search-overlay.tsx           Full-screen search with trending + quick chips
    ask-widget.tsx               AI chat with deal cards, suggestions, follow-ups
    feedback-modal.tsx           Contact form, portal-rendered, spam protected
    back-to-top.tsx              Scroll button (bottom-left)
    dirham-icon.tsx              UAE Dirham currency symbol (SVG)

  hooks/
    use-sheet-data.ts            Parallel CSV fetch, 5min cache, localStorage fallback
    use-favorites.ts             localStorage read/write
    use-trending.ts              Redis tap tracking, optimistic UI

  contexts/
    deals-context.tsx            Global state, filters, search, sort, favorites, trending

  lib/
    types.ts                     TypeScript interfaces for all 7 categories
    constants.ts                 Sheet GIDs, category config, emirate list
    sheets.ts                    CSV parsers (one per category)
    utils.ts                     Hashing, slugs, date parsing, price helpers
    redis.ts                     Upstash Redis client (graceful if missing)
    analytics.ts                 GA4 event helpers
```

## Setup

```bash
npm install
npm run dev
```

Open [localhost:3000](http://localhost:3000).

## Environment Variables

All optional. The app works without any of them (AI, trending, email, and scout just get disabled).

| Variable | What it does | Where it runs |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | OG meta base URL | Client |
| `OPENROUTER_API_KEY` | AI deal finder + deal scout | Server only |
| `UPSTASH_REDIS_REST_URL` | Trending + tap counts | Server only |
| `UPSTASH_REDIS_REST_TOKEN` | Redis auth | Server only |
| `RESEND_API_KEY` | Contact form email delivery | Server only |
| `GOOGLE_SHEET_ID` | Deal scout writes to review tab | Server only |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Google Sheets API auth (base64) | Server only |
| `CRON_SECRET` | Vercel cron job auth | Server only |

None of the server-side keys use `NEXT_PUBLIC_` prefix. They never appear in the client bundle.

## Security

- All API keys are server-side only, never in git, never in client JS
- `/api/sheets` rate limited at 30 req/min per IP
- `/api/ask` rate limited at 10 req/min per IP
- `/api/contact` rate limited at 3 req/hr per IP + honeypot + time gate
- HTML scraping uses stateful parser (not regex) to avoid CodeQL-flagged bypass vectors
- `bookVia` URLs validated as https:// or phone number format
- AI input capped at 500 chars, output at 600 tokens
- Google Sheets URL only exists in the server-side route file

## Swapping the Data Source

1. Publish your Google Sheet to the web (File > Share > Publish to web > CSV)
2. Update `SHEET_BASE_URL` in `src/app/api/sheets/[gid]/route.ts`
3. Update `SHEET_GIDS` in `src/lib/constants.ts` with your sheet's GID values
4. Update the parser functions in `src/lib/sheets.ts` if your columns differ

The app skips the first 3 rows of each sheet (title, disclaimer, headers) and parses from row 4.

## Credits

Deals compiled by **Dom** from the **Adtech Chat MENA** WhatsApp Group.

## License

MIT
