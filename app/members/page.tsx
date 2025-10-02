'use client';
import { useState } from 'react';
import Image from 'next/image';



export default function MembersPage() {
    const [input, setInput] = useState('');
    const [authorized, setAuthorized] = useState(false);
    const [error, setError] = useState('');
    const [selectedColor, setSelectedColor] = useState('white');
    const [showPurchase, setShowPurchase] = useState(false);

    const colorIframes: Record<string, string> = {
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

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const response = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: input }),
  });
  const { authorized, error } = await response.json();
  setAuthorized(authorized);
  setError(error || 'Incorrect password, please try again.');
};
    if (!authorized) {
        return (
            <div style={{ maxWidth: 400, margin: '100px auto', textAlign: 'center' }}>
                <h2 className="uppercase">Members Only</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Enter password"
                        className="block w-full rounded-md bg-white px-3.5 my-3.5 py-2 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    />
                    <button type="submit" className="block w-full rounded-md bg-indigo-600 my-3.5 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                        Submit
                    </button>
                </form>
            <button
                type="button"
                className="block w-full rounded-md bg-green-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                onClick={() => setShowPurchase(prev => !prev)}
            >
                {showPurchase ? 'Hide Purchase Option' : 'Purchase Site Password'}
            </button>
                {/* Show purchase iframe if showPurchase is true */}
                {showPurchase && (
                    <div className="flex justify-center w-full my-4">
                        <iframe
                            src="https://gckn66p.pushpress.com/open/purchase/prd_79b0e7bc74427c"
                            title="Purchase Site Password"
                            allowFullScreen
                            className="w-full h-[500px] rounded-lg border border-gray-300"
                        />
                    </div>
                )}
                {error && (
                    <div className="text-red-600 mt-2">{error}</div>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Welcome, Member!</h1>
            <div className="mb-6 w-full flex flex-col items-center">
            <label htmlFor="color-select" className="block mb-2 font-medium text-gray-700">
                Choose a Belt Level:
            </label>
            <select
                id="color-select"
                className="block w-[25%] rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                value={selectedColor}
                onChange={e => setSelectedColor(e.target.value)}
            >
                <option value="white" defaultValue='/study/white.png'>White</option>
                <option value="yellow">Yellow</option>
                <option value="orange">Orange</option>
                <option value="green">Green</option>
                <option value="purple">Purple</option>
                <option value="lightBlue">Light Blue</option>
                <option value="darkBlue">Dark Blue</option>
                <option value="brown">Brown</option>
                <option value="red">Red</option>
            </select>
            </div>
           
                <div className="border border-gray-300 rounded-lg overflow-hidden w-full max-w-4xl mx-auto">
                    <Image
                        src={colorIframes[selectedColor]}
                        alt="Belt Level"
                        className="w-full min-h-[500px] object-contain bg-white"
                        width={1200}
                        height={500}
                        
                    />
                </div>
         
        </div>
    );
}