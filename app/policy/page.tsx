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
        <div className="min-h-screen flex items-center justify-center">
            <div className="p-8 bg-white text-black rounded-lg shadow-md flex flex-col items-center justify-center max-w-3xl mx-auto max-h-3xl overflow-y-auto">
            <div className="flex flex-1 items-center justify-center w-full h-full">
                <ul className="space-y-3 w-full max-w-md">
                {policies.map((policy) => (
                    <li key={policy.key}>
                    <button
                        className="w-full flex items-center justify-between px-5 py-3 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        onClick={() => handleOpen(policy.key)}
                    >
                        {policy.name}
                        <span className="ml-2 text-lg">&rarr;</span>
                    </button>
                    </li>
                ))}
                </ul>
            </div>

            {/* Simple modal implementation */}
            {open && selectedPolicy === "refund" && (
            <div
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                onClick={handleClose}
            >
                <div
                className="relative bg-white text-black p-6 rounded-lg min-w-[300px] max-w-[90vw] w-[90vw] h-[50vh] overflow-y-auto"
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
                className="relative bg-white text-black p-6 rounded-lg min-w-[300px] max-w-[90vw] w-[90vw] h-[50vh] overflow-y-auto"
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
                className="relative bg-white text-black p-6 rounded-lg min-w-[300px] max-w-[90vw] w-[90vw] h-[50vh] overflow-y-auto"
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
        </div>
    );
}