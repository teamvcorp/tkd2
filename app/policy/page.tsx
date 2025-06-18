'use client'
import React, { useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import the Privacy component
const Privacy = dynamic(() => import("../components/Privacy"), { ssr: false });
const Refund = dynamic(() => import("../components/refund"), { ssr: false });
const Terms = dynamic(() => import("../components/terms"), { ssr: false });

const policies = [
    { name: "Privacy Policy", key: "privacy" },
    { name: "Refund Policy", key: "refund" },
    { name: "Terms & Conditions", key: "terms" },
    // Add more policies here if needed
];

export default function PolicyPage() {
    const [open, setOpen] = useState(false);
    const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null);

    const handleOpen = (key: string) => {
        setSelectedPolicy(key);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedPolicy(null);
    };

    return (
        <div className="p-8 bg-white text-black min-h-screen">
            <h1 className="text-3xl font-bold mb-6">Policies</h1>
            <ul>
                {policies.map((policy) => (
                    <li key={policy.key} className="mb-2">
                        <button
                            className="text-blue-600 underline bg-transparent border-none cursor-pointer p-0"
                            onClick={() => handleOpen(policy.key)}
                        >
                            {policy.name}
                        </button>
                    </li>
                ))}
            </ul>

            {/* Simple modal implementation */}
            {open && selectedPolicy === "refund" && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={handleClose}
                >
                    <div
                        className="relative bg-white text-black p-6 rounded-lg min-w-[300px] max-w-[90vw] max-h-[90vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={handleClose}
                            className="absolute top-2 right-2 bg-transparent border-none text-2xl cursor-pointer"
                            aria-label="Close"
                        >
                            &times;
                        </button>
                        <Refund />
                    </div>
                </div>
            )}
            {open && selectedPolicy === "privacy" && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={handleClose}
                >
                    <div
                        className="relative bg-white text-black p-6 rounded-lg min-w-[300px] max-w-[90vw] max-h-[90vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={handleClose}
                            className="absolute top-2 right-2 bg-transparent border-none text-2xl cursor-pointer"
                            aria-label="Close"
                        >
                            &times;
                        </button>
                        <Privacy />
                    </div>
                </div>
            )}
            {open && selectedPolicy === "terms" && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={handleClose}
                >
                    <div
                        className="relative bg-white text-black p-6 rounded-lg min-w-[300px] max-w-[90vw] max-h-[90vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={handleClose}
                            className="absolute top-2 right-2 bg-transparent border-none text-2xl cursor-pointer"
                            aria-label="Close"
                        >
                            &times;
                        </button>
                        <Terms />
                    </div>
                </div>
            )}
        </div>
    );
}