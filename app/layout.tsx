import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/navbar";




export const metadata: Metadata = {
  title: "Taekwondo of Storm Lake",
  description: "Taekwondo, Fitness, and Leadership",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <body
        className={`antialiased`}
      >
        <Navbar />

        {children}

      </body>
    </html>
  );
}
