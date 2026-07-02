import { NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import { getHero, saveHero } from '@/lib/hero';
import { emptyHeroConfig, type HeroConfig, type HeroItem } from '@/lib/hero-types';

export const dynamic = 'force-dynamic';

/* GET — current hero config (or an empty skeleton so the editor always has shape). */
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const hero = (await getHero()) ?? emptyHeroConfig();
  return NextResponse.json({ hero });
}

/** Coerce arbitrary input into a clean HeroItem[] (drops anything malformed). */
function sanitizeItems(input: unknown, mediaType: 'image' | 'video'): HeroItem[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((i): i is { id?: unknown; url?: unknown } => !!i && typeof i === 'object')
    .filter((i) => typeof i.url === 'string' && (i.url as string).length > 0)
    .map((i) => ({
      id: typeof i.id === 'string' && i.id ? i.id : crypto.randomUUID(),
      url: i.url as string,
      mediaType,
    }));
}

/* POST — fully replace the hero config. Any Blob URLs that were present before
   but are absent now are deleted so removed media doesn't orphan in storage. */
export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as Partial<HeroConfig>;
  const mode = body.mode === 'video' ? 'video' : 'gallery';
  const videos = sanitizeItems(body.videos, 'video');
  const images = sanitizeItems(body.images, 'image');

  const next: HeroConfig = {
    id: 'hero',
    mode,
    videos,
    images,
    updatedAt: new Date().toISOString(),
  };

  // Best-effort cleanup of removed Blob media (never blocks the save).
  const existing = await getHero();
  if (existing) {
    const keep = new Set([...videos, ...images].map((i) => i.url));
    const removed = [...existing.videos, ...existing.images]
      .map((i) => i.url)
      .filter((url) => url && !keep.has(url));
    for (const url of removed) {
      try {
        await del(url, { token: process.env.Images_READ_WRITE_TOKEN });
      } catch (err) {
        console.error('hero: blob cleanup failed for', url, err);
      }
    }
  }

  await saveHero(next);
  return NextResponse.json({ hero: next });
}
