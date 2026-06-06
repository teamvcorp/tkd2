'use client';

import { PROGRAMS, formatPrice } from '@/lib/programs';

interface ProgramPickerProps {
  value: string;
  onChange: (programId: string) => void;
  /** Unique prefix so multiple pickers on one page don't collide on ids. */
  idPrefix: string;
}

// Selectable program cards. Replaces the cramped single-line <select> so parents
// can read each program's name, description, and price and compare at a glance.
export default function ProgramPicker({ value, onChange, idPrefix }: ProgramPickerProps) {
  return (
    <div role="radiogroup" aria-label="Program" className="grid gap-2">
      {PROGRAMS.map((p) => {
        const selected = value === p.id;
        return (
          <button
            key={p.id}
            id={`${idPrefix}-${p.id}`}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(p.id)}
            className={`w-full text-left rounded-lg border px-3.5 py-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              selected
                ? 'border-indigo-600 ring-1 ring-indigo-600 bg-indigo-50'
                : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <span className={`text-sm font-semibold ${selected ? 'text-indigo-900' : 'text-gray-900'}`}>
                {p.name}
              </span>
              <span className={`text-sm font-bold whitespace-nowrap ${selected ? 'text-indigo-700' : 'text-indigo-600'}`}>
                {formatPrice(p.pricePerYear, p.oneTimeFee, p.durationYears)}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">{p.description}</p>
          </button>
        );
      })}
    </div>
  );
}
