import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar, NavbarDivider, NavbarItem, NavbarSection } from '../app/components/navbar'
import { Link } from './components/link'
import { Sidebar } from '../app/components/sidebar'
import { StackedLayout } from '../app/components/stacked-layout'
import { Button } from "./components/button";
import Image from "next/image";
import styles from "../app/styles/Navbar.module.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
       <Navbar ><Link href="/" aria-label="Home">
            <Image className='outline-none' src='/tkdlogo.png' width='250' height='200' alt="tkd logo"/>
          </Link>
            <NavbarDivider />
            
            <NavbarSection className={` flex justify-between gap-6`} >
              <NavbarItem className={styles.nav} href="/" >Home</NavbarItem>
              <NavbarItem className={styles.nav} href="/about">About</NavbarItem>
              <NavbarItem className={styles.nav} href="/classes">Classes</NavbarItem>
              <NavbarItem className={styles.nav} href="/contact">Contact</NavbarItem>
            </NavbarSection><button className="ml-auto bg-red-500 rounded px-4 py-2 text-white">Sign up Today!</button></Navbar>
          {children}
       
      </body>
    </html>
  );
}
