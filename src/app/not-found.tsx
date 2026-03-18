import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import { TopBar } from '@/components/top-bar';

export const metadata: Metadata = {
  title: 'Habibi, You Are Lost | DXBSave',
  description: 'This page is stuck in Hessa Street traffic. Head back to find real UAE deals.',
};

const FUNNY_REASONS = [
  'stuck in Hessa Street traffic.',
  'checking out a villa in Emirates Hills.',
  'still waiting for the RTA app to load.',
  'on a long weekend in Ras Al Khaimah.',
  'queuing for brunch at Soho Garden.',
  'circling Dubai Mall parking on a Friday.',
  'lost somewhere between Deira and Downtown.',
  'probably at DIFC on ladies night.',
  'still loading on a 5G connection somehow.',
  'hiding from the summer heat in a mall.',
  'on its third coffee from % Arabica.',
  'waiting for a cab that cancelled twice.',
  'somewhere on the 311 during rush hour.',
  'getting confused by a new Salik gate.',
  'exploring a new neighbourhood that opened last week.',
  'stuck behind a very confident parallel parker in JBR.',
  'at a rooftop pop-up that opened yesterday.',
  'taking the long way because the shortcut is now a construction site.',
  'delayed by a sandstorm — visibility zero, vibes immaculate.',
  'doing laps in the Dubai Frame car park.',
  'waiting for the iftar cannon.',
  'ordering from three different apps to compare delivery times.',
  'checking if it is actually cold enough for a jacket today.',
  'caught in the queue at a new restaurant that opened this morning.',
  'having a shawarma somewhere on Al Dhiyafa Road.',
  'trying to find free parking near the marina.',
  'on a spontaneous road trip to Fujairah.',
  'discovering a hidden beach on the East Coast.',
  'debating whether to go to Yas Island or just watch Netflix.',
  'at an all-you-can-eat sushi place and not leaving anytime soon.',
  'somewhere in Global Village until midnight.',
  'getting lost in the souks in a beautiful way.',
  'waiting for that one friend who is always 20 minutes late.',
  'doing a staycation at a hotel literally 5 minutes from home.',
  'at a rooftop watching the Burj Khalifa fountain show.',
  'taking photos for the gram at a flower wall in JLT.',
  'on a desert safari and completely offline.',
  'in a hotel pool on a Tuesday afternoon because why not.',
  'exploring Al Quoz galleries on a whim.',
  'waiting for the new metro stop to open.',
  'at the spice souk and buying way too much saffron.',
  'attending a food festival in Abu Dhabi.',
  'watching a sunset from Jebel Jais.',
  'lost in IKEA — the most UAE thing possible.',
  'at a brunch that started at 1pm and it is now 7pm.',
  'testing every hotel pool day pass in Dubai.',
  'on a yacht somewhere near Palm Jumeirah.',
  'in a café that has no signal but excellent flat whites.',
  'at a padel court in 38 degrees and absolutely loving it.',
  'watching a camel race at Al Marmoom.',
  'browsing the gold souk for absolutely no reason.',
  'in an aquarium tunnel wondering where life went.',
  'at a night market that did not exist last month.',
  'doing a sunrise hike in Hatta.',
];

// Pick a deterministic-ish reason based on current minute
const reason = FUNNY_REASONS[new Date().getMinutes() % FUNNY_REASONS.length];

export default function NotFound() {
  return (
    <div className="min-h-screen bg-stone-50">
      <TopBar />
      <main className="flex flex-col items-center justify-center px-5 py-12 text-center">

      {/* Character */}
      <div className="relative mb-[-20px] select-none" style={{ animation: 'float 3s ease-in-out infinite' }}>
        <Image
          src="/habibi.png"
          alt="Habibi character"
          width={220}
          height={220}
          className="drop-shadow-2xl"
          priority
        />
      </div>

      {/* Cracked 404 */}
      <div className="relative mb-6">
        <span
          className="text-[120px] sm:text-[160px] font-black text-stone-900 leading-none select-none tracking-tighter"
          style={{
            WebkitTextStroke: '2px #1c1917',
            textShadow: '4px 4px 0px rgba(0,0,0,0.12)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          4
        </span>
        {/* Cracked 0 */}
        <span className="relative inline-block">
          <span
            className="text-[120px] sm:text-[160px] font-black text-stone-900 leading-none select-none tracking-tighter"
            style={{
              WebkitTextStroke: '2px #1c1917',
              textShadow: '4px 4px 0px rgba(0,0,0,0.12)',
            }}
          >
            0
          </span>
          {/* Crack SVG overlay */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 120"
            fill="none"
          >
            <path d="M55 10 L48 40 L62 42 L52 80 L58 82 L45 115" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M55 10 L48 40 L62 42 L52 80 L58 82 L45 115" stroke="#1c1917" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M48 40 L35 55" stroke="#1c1917" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
            <path d="M62 42 L75 50" stroke="#1c1917" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
          </svg>
        </span>
        <span
          className="text-[120px] sm:text-[160px] font-black text-stone-900 leading-none select-none tracking-tighter"
          style={{
            WebkitTextStroke: '2px #1c1917',
            textShadow: '4px 4px 0px rgba(0,0,0,0.12)',
          }}
        >
          4
        </span>
      </div>

      {/* Headline */}
      <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-2 leading-snug max-w-sm">
        Habibi... you are lost.
      </h1>

      {/* Subtext */}
      <p className="text-stone-500 text-[15px] max-w-xs mb-1 leading-relaxed">
        This page is {reason}
      </p>
      <p className="text-stone-400 text-[13px] mb-8">
        (Maybe it&apos;s the 15th time you tried that detour?)
      </p>

      {/* CTA buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <Link
          href="/"
          className="flex-1 bg-stone-900 text-white text-[14px] font-semibold py-3.5 px-6 rounded-2xl text-center active:scale-95 transition-transform duration-100 shadow-lg shadow-stone-900/20"
        >
          Take the Metro Back Home
        </Link>
        <Link
          href="/deals"
          className="flex-1 bg-white text-stone-800 text-[14px] font-semibold py-3.5 px-6 rounded-2xl text-center ring-1 ring-stone-200 active:scale-95 transition-transform duration-100"
        >
          Browse All Deals
        </Link>
      </div>

      {/* Quick category links */}
      <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-xs">
        {[
          { href: '/deals/hotels', label: '🏨 Hotels' },
          { href: '/deals/dining', label: '🍽️ Dining' },
          { href: '/deals/spa', label: '💆 Spa' },
          { href: '/deals/attractions', label: '🎡 Attractions' },
          { href: '/deals/delivery', label: '🛵 Delivery' },
        ].map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="text-[12px] text-stone-500 bg-white ring-1 ring-stone-100 px-3 py-1.5 rounded-full hover:text-stone-800 hover:ring-stone-300 transition-colors"
          >
            {label}
          </Link>
        ))}
      </div>

      <p className="mt-10 text-[11px] text-stone-300">
        dxbsave.com — real deals, no wrong turns
      </p>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </main>

  </div>
  );
}
