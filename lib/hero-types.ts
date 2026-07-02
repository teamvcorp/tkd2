// ─── Hero config types (client-safe) ──────────────────────────────────────────
// Shared between the admin editor, the API routes, and the public landing hero.
// Do NOT import server-only modules here.

export type HeroMode = 'video' | 'gallery';

export interface HeroItem {
  id: string;
  /** Vercel Blob URL of the uploaded media. */
  url: string;
  mediaType: 'image' | 'video';
}

export interface HeroConfig {
  /** Singleton document key — always 'hero'. */
  id: 'hero';
  /** Which list is live on the landing page. */
  mode: HeroMode;
  /** Video mode. Array order = display order; index 0 is the "main" video. */
  videos: HeroItem[];
  /** Gallery mode. Array order = display order; index 0 is the "main" image. */
  images: HeroItem[];
  updatedAt: string;
}

/** A fresh, empty config used before anything has been saved. */
export function emptyHeroConfig(): HeroConfig {
  return { id: 'hero', mode: 'gallery', videos: [], images: [], updatedAt: '' };
}
