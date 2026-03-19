import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { DealsProvider } from "@/contexts/deals-context";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dxbsave.com';

export const metadata: Metadata = {
  title: {
    default: "DXBSave — UAE's Best Deals & Offers",
    template: "%s | DXBSave",
  },
  description:
    "Discover 286+ verified deals across the UAE — hotels, dining, attractions, delivery codes, spa and Eid specials. Updated daily. 100% free.",
  keywords: [
    "UAE deals", "Dubai offers", "Abu Dhabi deals", "UAE hotel deals",
    "Dubai restaurant offers", "happy hour Dubai", "free attractions Dubai",
    "Eid deals UAE", "staycation deals", "delivery promo codes UAE",
    "DXBSave", "Dubai savings",
  ],
  authors: [{ name: "DXBSave" }],
  creator: "DXBSave",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "https://dxbsave.com",
    languages: {
      'en-AE': 'https://dxbsave.com',
      'ar-AE': 'https://dxbsave.com/ar',
    },
  },
  openGraph: {
    title: "DXBSave — UAE's Best Deals & Offers",
    description:
      "286+ verified deals across the UAE — hotels, dining, attractions, delivery codes and more. Updated daily.",
    url: SITE_URL,
    siteName: "DXBSave",
    locale: "en_AE",
    type: "website",
    images: [
      {
        url: "/shared-image.jpg",
        width: 1200,
        height: 630,
        alt: "DXBSave — UAE's Best Deals & Offers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DXBSave — UAE's Best Deals & Offers",
    description:
      "286+ verified deals across the UAE. Hotels, dining, attractions, delivery codes. Updated daily.",
    images: ["/shared-image.jpg"],
  },
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AE">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "DXBSave",
              "url": "https://dxbsave.com",
              "description": "Discover 286+ verified deals across the UAE. Hotels, dining, attractions, delivery codes, spa and Eid specials.",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://dxbsave.com/?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "DXBSave",
              "url": "https://dxbsave.com",
              "logo": "https://dxbsave.com/shared-image.jpg",
              "sameAs": ["https://github.com/AmerSarhan/DXBsave"],
              "description": "UAE's best deals and offers platform"
            })
          }}
        />
      </head>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-P3L6DHYDZT"
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-P3L6DHYDZT');
        `}
      </Script>
      <body className={`${geistSans.variable} font-sans antialiased bg-stone-50`}>
        <DealsProvider>
          {children}
          <Toaster position="bottom-center" />
          <Analytics />
        </DealsProvider>
      </body>
    </html>
  );
}
