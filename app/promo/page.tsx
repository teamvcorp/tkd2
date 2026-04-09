'use client';

import { useState } from 'react';
import PromoModal from '@/app/components/PromoModal';

export default function PromoPage() {
    const [open, setOpen] = useState(true);

    return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <PromoModal open={open} onClose={() => setOpen(false)} />
            {!open && (
                <div className="text-center">
                    <p className="text-gray-600 mb-4">Promo closed.</p>
                    <button
                        onClick={() => setOpen(true)}
                        className="rounded-md bg-green-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-green-700"
                    >
                        View Current Promo
                    </button>
                </div>
            )}
        </div>
    );
}
