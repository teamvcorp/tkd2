import React from "react";

const Footer: React.FC = () => (
    <footer className="fixed bottom-0 left-0 w-full bg-black text-white py-4 text-center">
        <span>&copy; {new Date().getFullYear()} VA Corp. All rights reserved.</span>
        &nbsp;|&nbsp;
        <a href="/policy" className="underline hover:text-gray-400">
            Policy
        </a>
    </footer>
);

export default Footer;