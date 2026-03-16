'use client';

import { useState, useEffect, useRef } from 'react';

interface NominatimResult {
  place_id: number;
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
  };
}

function formatAddress(r: NominatimResult): string {
  const a = r.address;
  return [
    [a.house_number, a.road].filter(Boolean).join(' '),
    a.city ?? a.town ?? a.village,
    a.state,
    a.postcode,
  ]
    .filter(Boolean)
    .join(', ');
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  name?: string;
}

export default function AddressAutocomplete({ value, onChange, placeholder, id, name }: Props) {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions with debounce
  useEffect(() => {
    if (value.length < 5) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url =
          `https://nominatim.openstreetmap.org/search` +
          `?format=json&addressdetails=1` +
          `&q=${encodeURIComponent(value)}` +
          `&countrycodes=us&limit=5`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
        const data: NominatimResult[] = await res.json();
        // Only show results that have a street-level address
        const filtered = data.filter(
          (r) => r.address.road && (r.address.house_number || r.address.road),
        );
        setSuggestions(filtered);
        setOpen(filtered.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        name={name}
        type="text"
        autoComplete="off"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        placeholder={placeholder}
        className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />

      {/* Loading spinner */}
      {loading && (
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Suggestions dropdown */}
      {open && suggestions.length > 0 && (
        <ul className="absolute z-[60] mt-1 w-full bg-white rounded-md border border-gray-200 shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((s) => {
            const formatted = formatAddress(s);
            return (
              <li key={s.place_id}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault(); // prevent input blur before click fires
                    onChange(formatted);
                    setOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-800 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  {formatted}
                </button>
              </li>
            );
          })}
          <li className="px-3 py-1.5 text-xs text-gray-400 border-t border-gray-100">
            Don&apos;t see your address? Just type it in and continue.
          </li>
        </ul>
      )}
    </div>
  );
}
