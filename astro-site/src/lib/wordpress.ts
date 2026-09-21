// Type-safe helper for the headless WordPress REST API.
//
// No real backend exists yet, so every getter falls back to the mock data in
// mock-data.ts when the API is unreachable or WORDPRESS_API_URL is unset.
// Once a real WordPress instance is live, set WORDPRESS_API_URL in .env
// (see .env.example) — the real API is used automatically, no code changes
// needed.

import { mockPages, mockPosts } from './mock-data';

const WORDPRESS_API_URL = import.meta.env.WORDPRESS_API_URL;

export interface WPPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  featuredImageUrl: string | null;
}

export interface WPPage {
  id: number;
  slug: string;
  title: string;
  content: string;
}

interface RawWPRendered {
  rendered: string;
}

interface RawWPPost {
  id: number;
  slug: string;
  date: string;
  title: RawWPRendered;
  excerpt: RawWPRendered;
  content: RawWPRendered;
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url: string }>;
  };
}

interface RawWPPage {
  id: number;
  slug: string;
  title: RawWPRendered;
  content: RawWPRendered;
}

function mapPost(raw: RawWPPost): WPPost {
  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title.rendered,
    excerpt: raw.excerpt.rendered,
    content: raw.content.rendered,
    date: raw.date,
    featuredImageUrl: raw._embedded?.['wp:featuredmedia']?.[0]?.source_url ?? null,
  };
}

function mapPage(raw: RawWPPage): WPPage {
  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title.rendered,
    content: raw.content.rendered,
  };
}

async function wpFetch<T>(path: string): Promise<T> {
  if (!WORDPRESS_API_URL) {
    throw new Error('WORDPRESS_API_URL is not set');
  }
  const response = await fetch(`${WORDPRESS_API_URL}${path}`);
  if (!response.ok) {
    throw new Error(`WordPress API request failed: ${response.status} ${path}`);
  }
  return response.json() as Promise<T>;
}

let hasWarnedFallback = false;
function warnMockFallback(fn: string, error: unknown): void {
  if (hasWarnedFallback) return;
  hasWarnedFallback = true;
  const reason = error instanceof Error ? error.message : String(error);
  console.warn(
    `[wordpress.ts] ${fn}: kon geen contact maken met de WordPress API ` +
      `(${WORDPRESS_API_URL || 'WORDPRESS_API_URL niet ingesteld'}). ` +
      `Gebruik mock-data uit src/lib/mock-data.ts. Zie README.md om een echte backend te koppelen. (${reason})`
  );
}

export async function getPosts(): Promise<WPPost[]> {
  try {
    const raw = await wpFetch<RawWPPost[]>('/wp/v2/posts?_embed&per_page=50');
    return raw.map(mapPost);
  } catch (error) {
    warnMockFallback('getPosts', error);
    return mockPosts;
  }
}

export async function getPostBySlug(slug: string): Promise<WPPost | undefined> {
  try {
    const raw = await wpFetch<RawWPPost[]>(`/wp/v2/posts?_embed&slug=${encodeURIComponent(slug)}`);
    return raw[0] ? mapPost(raw[0]) : undefined;
  } catch (error) {
    warnMockFallback('getPostBySlug', error);
    return mockPosts.find((post) => post.slug === slug);
  }
}

export async function getPages(): Promise<WPPage[]> {
  try {
    const raw = await wpFetch<RawWPPage[]>('/wp/v2/pages?per_page=50');
    return raw.map(mapPage);
  } catch (error) {
    warnMockFallback('getPages', error);
    return mockPages;
  }
}

export async function getPageBySlug(slug: string): Promise<WPPage | undefined> {
  try {
    const raw = await wpFetch<RawWPPage[]>(`/wp/v2/pages?slug=${encodeURIComponent(slug)}`);
    return raw[0] ? mapPage(raw[0]) : undefined;
  } catch (error) {
    warnMockFallback('getPageBySlug', error);
    return mockPages.find((page) => page.slug === slug);
  }
}
