import type { Metadata } from 'next';
import { fetchDealBySlug } from '@/lib/fetch-deal-server';
import { DealPageClient } from '@/components/deal-page-client';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const deal = await fetchDealBySlug(slug);
  if (!deal) return { title: 'Deal Not Found | DXBSave' };

  const priceText = deal.price && deal.price !== '-' ? ` from AED ${deal.price}` : '';
  const emirateText = deal.emirate && deal.emirate !== 'UAE' ? ` in ${deal.emirate}` : ' — UAE';
  const title = `${deal.name} — ${deal.offer} | DXBSave`;
  const description = `${deal.offer}${priceText}${emirateText}. Verified deal on DXBSave — UAE's best curated offers updated daily.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://dxbsave.com/deal/${slug}`,
    },
  };
}

export default async function DealPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const deal = await fetchDealBySlug(slug);

  const schema = deal ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: deal.name,
    description: deal.offer,
    brand: { '@type': 'Brand', name: deal.name },
    offers: {
      '@type': 'Offer',
      price: (deal.price || '0').replace(/[^0-9.]/g, '') || '0',
      priceCurrency: 'AED',
      availability: 'https://schema.org/InStock',
      ...(deal.validUntil && deal.validUntil !== 'Ongoing' && deal.validUntil !== ''
        ? { validThrough: deal.validUntil }
        : {}),
      seller: { '@type': 'Organization', name: 'DXBSave', url: 'https://dxbsave.com' },
    },
  } : null;

  return (
    <>
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}
      <DealPageClient slug={slug} serverDeal={deal} />
    </>
  );
}
