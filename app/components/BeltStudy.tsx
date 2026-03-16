'use client';

import { useState } from 'react';
import Image from 'next/image';
import { signOut } from 'next-auth/react';

export const beltImages: Record<string, string> = {
  white: '/study/white.png',
  yellow: '/study/yellow.png',
  orange: '/study/orange.png',
  green: '/study/green.png',
  purple: '/study/purple.png',
  lightBlue: '/study/lightBlue.png',
  darkBlue: '/study/DarkBlueBelt24.jpg',
  brown: '/study/BrownBelt24.jpg',
  red: '/study/redBelt24.jpg',
};

export const BELT_LABELS: { value: string; label: string }[] = [
  { value: 'white', label: 'White' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'orange', label: 'Orange' },
  { value: 'green', label: 'Green' },
  { value: 'purple', label: 'Purple' },
  { value: 'lightBlue', label: 'Light Blue' },
  { value: 'darkBlue', label: 'Dark Blue' },
  { value: 'brown', label: 'Brown' },
  { value: 'red', label: 'Red' },
];

interface BeltStudyProps {
  /** Display name shown in the welcome header */
  userName: string;
  /** Belt to start on — locks the selector to this belt. Defaults to 'white'. */
  initialBelt?: string;
  /** Show the Sign Out button. Defaults to true. */
  showSignOut?: boolean;
  /** Optional back navigation callback */
  onBack?: () => void;
}

export default function BeltStudy({ userName, initialBelt = 'white', showSignOut = true, onBack }: BeltStudyProps) {
  const [selectedBelt, setSelectedBelt] = useState(initialBelt);

  return (
    <div className="flex flex-col items-center min-h-screen px-4 py-8">
      <div className="w-full max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-1"
              >
                ← Back
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome, {userName}!</h1>
              <p className="text-sm text-gray-500">Belt study materials</p>
            </div>
          </div>
          {showSignOut && (
            <button
              onClick={() => signOut({ callbackUrl: '/members' })}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Sign Out
            </button>
          )}
        </div>

        <div className="mb-6">
          <label htmlFor="belt-select" className="block mb-2 text-sm font-medium text-gray-700">
            Choose a Belt Level:
          </label>
          <select
            id="belt-select"
            className="block w-full sm:w-48 rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
            value={selectedBelt}
            onChange={(e) => setSelectedBelt(e.target.value)}
          >
            {BELT_LABELS.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </div>

        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <Image
            src={beltImages[selectedBelt]}
            alt={`${selectedBelt} belt study sheet`}
            className="w-full object-contain bg-white"
            width={1200}
            height={500}
          />
        </div>
      </div>
    </div>
  );
}
