// Voorbeelddata zodat de site bouwt en draait zonder een live WordPress-backend.
// Wordt automatisch genegeerd zodra WORDPRESS_API_URL in .env naar een bereikbare
// WordPress REST API wijst (zie wordpress.ts).

import type { WPPage, WPPost } from './wordpress';

export const mockPosts: WPPost[] = [
  {
    id: 1,
    slug: 'welkom-nieuw-verenigingsjaar',
    title: 'Welkom in het nieuwe verenigingsjaar',
    excerpt: '<p>We trappen het nieuwe jaar af met een nieuwe website en een frisse start.</p>',
    content:
      '<p>We trappen het nieuwe jaar af met een nieuwe website en een frisse start. Dit bericht is voorbeelddata — zodra de WordPress-backend live staat, verschijnen hier de echte nieuwsberichten.</p>',
    date: '2026-09-01T09:00:00',
    featuredImageUrl: null,
  },
  {
    id: 2,
    slug: 'inschrijving-lustrumreis-geopend',
    title: 'Inschrijving lustrumreis geopend',
    excerpt: '<p>De inschrijving voor de lustrumreis is vanaf nu open.</p>',
    content: '<p>De inschrijving voor de lustrumreis is vanaf nu open. Dit bericht is voorbeelddata.</p>',
    date: '2026-08-20T14:00:00',
    featuredImageUrl: null,
  },
  {
    id: 3,
    slug: 'terugblik-eerstejaarsweekend',
    title: 'Terugblik: eerstejaarsweekend',
    excerpt: '<p>Een geslaagd weekend met veel nieuwe gezichten.</p>',
    content: '<p>Een geslaagd weekend met veel nieuwe gezichten. Dit bericht is voorbeelddata.</p>',
    date: '2026-08-05T11:00:00',
    featuredImageUrl: null,
  },
];

export const mockPages: WPPage[] = [
  {
    id: 10,
    slug: 'over-ons',
    title: 'Over ons',
    content:
      '<p>Dit is voorbeeldtekst voor de pagina "Over ons". Wordt automatisch overschreven zodra deze pagina in WordPress bestaat.</p>',
  },
  {
    id: 11,
    slug: 'contact',
    title: 'Contact',
    content: '<p>Dit is voorbeeldtekst voor de contactpagina. Wordt automatisch overschreven door de echte WordPress-pagina.</p>',
  },
];
