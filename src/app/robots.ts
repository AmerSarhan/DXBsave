import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/favorites'],
    },
    sitemap: 'https://dxbsave.com/sitemap.xml',
  };
}
