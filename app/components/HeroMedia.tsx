'use client';

/* eslint-disable @next/next/no-img-element */
// Blob-hosted media is rendered with raw <img>/<video> (not next/image) because
// next.config.ts declares no images.remotePatterns for the Blob host.

import { useEffect, useState } from 'react';
import type { HeroConfig, HeroItem } from '@/lib/hero-types';

// Fallback shown before anything is configured (or if the active list is empty),
// so the hero is never blank. Mirrors the site's original hardcoded slideshow.
const DEFAULT_IMAGES = ['/group.png', '/group1.png', '/group2.png'];

export default function HeroMedia() {
  const [hero, setHero] = useState<HeroConfig | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState(0);
  const [fallbackIndex, setFallbackIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/hero')
      .then((r) => (r.ok ? r.json() : { hero: null }))
      .then((data) => { if (!cancelled) setHero(data.hero ?? null); })
      .catch(() => { if (!cancelled) setHero(null); })
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  // The list that's live for the current mode.
  const items: HeroItem[] =
    hero?.mode === 'video' ? (hero?.videos ?? []) : (hero?.images ?? []);
  const useFallback = !items.length;

  // Auto-advance the fallback slideshow (only when it's actually showing).
  useEffect(() => {
    if (!useFallback || DEFAULT_IMAGES.length <= 1) return;
    const id = setInterval(() => {
      setFallbackIndex((i) => (i + 1) % DEFAULT_IMAGES.length);
    }, 5000);
    return () => clearInterval(id);
  }, [useFallback]);

  // Keep the selected index valid if the list changes.
  useEffect(() => { setSelected(0); }, [hero?.mode, items.length]);

  const wrapperCls = 'relative mt-16 lg:mt-0 w-full lg:w-[1000px] lg:flex-none';

  // ── Fallback: default cross-fading image slideshow ─────────────────────────
  if (!loaded || useFallback) {
    return (
      <div className={wrapperCls}>
        <div className="relative w-full aspect-[2/1]">
          {DEFAULT_IMAGES.map((src, i) => (
            <img
              key={src}
              alt="Hawthorne TKD"
              src={src}
              className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-1000 ease-in-out ${
                i === fallbackIndex ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  const current = items[Math.min(selected, items.length - 1)];
  const isVideo = hero?.mode === 'video';

  return (
    <div className={wrapperCls}>
      {/* Main media */}
      <div className="relative w-full aspect-[2/1] bg-black/20 rounded-2xl overflow-hidden">
        {isVideo ? (
          <video
            key={current.url}
            src={current.url}
            controls
            playsInline
            preload="metadata"
            className="w-full h-full object-contain bg-black"
          />
        ) : (
          <img
            src={current.url}
            alt="Hawthorne TKD"
            className="w-full h-full object-contain"
          />
        )}
      </div>

      {/* Thumbnails — only when there's more than one item */}
      {items.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {items.map((item, i) => {
            const active = i === selected;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelected(i)}
                aria-label={`Show item ${i + 1}`}
                aria-pressed={active}
                className={`relative flex-shrink-0 w-24 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                  active ? 'border-red-500' : 'border-transparent hover:border-white/60'
                }`}
              >
                {isVideo ? (
                  // Muted metadata-only video renders its first frame as the thumb.
                  <video
                    src={item.url}
                    muted
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover bg-black pointer-events-none"
                  />
                ) : (
                  <img src={item.url} alt="" className="w-full h-full object-cover" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
