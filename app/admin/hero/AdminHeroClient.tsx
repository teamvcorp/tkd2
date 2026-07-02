'use client';

/* eslint-disable @next/next/no-img-element */
// Blob media rendered with raw <img>/<video> (no next/image remotePatterns configured).

import { useEffect, useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';
import type { HeroItem, HeroMode } from '@/lib/hero-types';

const MAX_VIDEO = 100 * 1024 * 1024; // 100 MB
const MAX_IMAGE = 10 * 1024 * 1024;  // 10 MB

export default function AdminHeroClient() {
  const [mode, setMode] = useState<HeroMode>('gallery');
  const [videos, setVideos] = useState<HeroItem[]>([]);
  const [images, setImages] = useState<HeroItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [savedAt, setSavedAt] = useState('');

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/hero');
        if (res.ok) {
          const { hero } = await res.json();
          if (hero) {
            setMode(hero.mode === 'video' ? 'video' : 'gallery');
            setVideos(hero.videos ?? []);
            setImages(hero.images ?? []);
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Persist the full config. Pass explicit next-state to avoid stale closures.
  async function persist(next: { mode: HeroMode; videos: HeroItem[]; images: HeroItem[] }) {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/hero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? 'Save failed.'); return false; }
      setSavedAt(new Date().toLocaleTimeString());
      return true;
    } catch {
      setError('Save failed.');
      return false;
    } finally {
      setSaving(false);
    }
  }

  const activeList = mode === 'video' ? videos : images;
  const setActiveList = (items: HeroItem[]) =>
    mode === 'video' ? setVideos(items) : setImages(items);

  const handleModeChange = (m: HeroMode) => {
    setMode(m);
    persist({ mode: m, videos, images });
  };

  const handleUpload = async (file: File) => {
    setError('');
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (mode === 'video' && !isVideo) { setError('Please choose a video file (MP4).'); return; }
    if (mode === 'gallery' && !isImage) { setError('Please choose an image file.'); return; }
    if (isVideo && file.size > MAX_VIDEO) { setError('Video must be under 100 MB.'); return; }
    if (isImage && file.size > MAX_IMAGE) { setError('Image must be under 10 MB.'); return; }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
      const blob = await upload(`hero/${mode}-${Date.now()}.${ext}`, file, {
        access: 'public',
        handleUploadUrl: '/api/admin/hero/upload',
        contentType: file.type,
      });
      const item: HeroItem = {
        id: crypto.randomUUID(),
        url: blob.url,
        mediaType: isVideo ? 'video' : 'image',
      };
      const nextVideos = isVideo ? [...videos, item] : videos;
      const nextImages = isImage ? [...images, item] : images;
      setVideos(nextVideos);
      setImages(nextImages);
      await persist({ mode, videos: nextVideos, images: nextImages });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeItem = (id: string) => {
    const next = activeList.filter((i) => i.id !== id);
    setActiveList(next);
    persist({
      mode,
      videos: mode === 'video' ? next : videos,
      images: mode === 'gallery' ? next : images,
    });
  };

  const makeMain = (id: string) => {
    const target = activeList.find((i) => i.id === id);
    if (!target) return;
    const next = [target, ...activeList.filter((i) => i.id !== id)];
    setActiveList(next);
    persist({
      mode,
      videos: mode === 'video' ? next : videos,
      images: mode === 'gallery' ? next : images,
    });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400 text-sm">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Landing Hero</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage the media shown in the homepage hero section.</p>
          </div>
          <a href="/admin" className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
            ← Back to Admin
          </a>
        </div>

        {/* Save status */}
        <div className="mb-4 h-5 text-sm">
          {error
            ? <span className="text-red-600">{error}</span>
            : saving
              ? <span className="text-gray-400">Saving…</span>
              : savedAt
                ? <span className="text-green-600">Saved at {savedAt}</span>
                : null}
        </div>

        {/* Mode toggle */}
        <div className="mb-6">
          <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Hero mode (live on the site)</span>
          <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
            {(['gallery', 'video'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleModeChange(m)}
                className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                  mode === m ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {m === 'gallery' ? 'Picture Gallery' : 'Video'}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {mode === 'video'
              ? 'Visitors see a main video with controls; extra videos appear as clickable thumbnails.'
              : 'Visitors see a main picture with clickable thumbnails of the others.'}
          </p>
        </div>

        {/* Upload */}
        <div className="mb-6">
          <input
            ref={fileRef}
            type="file"
            accept={mode === 'video' ? 'video/*' : 'image/*'}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : mode === 'video' ? '+ Upload MP4' : '+ Upload Picture'}
          </button>
          <span className="ml-3 text-xs text-gray-400">
            {mode === 'video' ? 'MP4/WebM up to 100 MB' : 'JPG/PNG/WebP up to 10 MB'}
          </span>
        </div>

        {/* Item grid */}
        {activeList.length === 0 ? (
          <p className="text-sm text-gray-400 py-10 text-center border border-dashed border-gray-300 rounded-xl">
            No {mode === 'video' ? 'videos' : 'pictures'} yet. Upload one above — the homepage shows the
            default images until you do.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {activeList.map((item, i) => (
              <div key={item.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                <div className="relative aspect-video bg-black">
                  {item.mediaType === 'video' ? (
                    <video src={item.url} muted playsInline preload="metadata" className="w-full h-full object-cover" />
                  ) : (
                    <img src={item.url} alt="" className="w-full h-full object-cover" />
                  )}
                  {i === 0 && (
                    <span className="absolute top-1.5 left-1.5 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                      Main
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 p-2">
                  <button
                    type="button"
                    disabled={i === 0 || saving}
                    onClick={() => makeMain(item.id)}
                    className="text-xs font-medium text-indigo-600 hover:underline disabled:text-gray-300 disabled:no-underline"
                  >
                    {i === 0 ? 'Main' : 'Make main'}
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => removeItem(item.id)}
                    className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
