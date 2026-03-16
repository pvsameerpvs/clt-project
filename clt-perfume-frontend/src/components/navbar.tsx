"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, Zap } from "lucide-react"
import { NavbarTicker } from "./navbar/navbar-ticker"
import { NavbarActions } from "./navbar/navbar-actions"
import { NavbarSearch } from "./navbar/navbar-search"
import { MegaMenu } from "./navbar/mega-menu"
import { MobileMenu } from "./navbar/mobile-menu"


export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="w-full bg-white z-50 relative">
      <NavbarTicker />

      {/* Main Header */}
      <div className="container mx-auto px-4 py-4 md:py-6">
        <div className="flex items-center justify-between gap-4 md:gap-6">
          
          {/* Mobile Menu Icon */}
          <button 
            className="lg:hidden p-2 -ml-2 text-neutral-600 hover:text-black"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex-1 lg:flex-none flex justify-center lg:justify-start">
            <div className="flex flex-col items-center">
               <Image src="/perfume-sam.png" alt="CLE Perfumes" width={100} height={40} className="object-contain w-auto h-8 md:h-10" priority />
               <span className="text-[8px] md:text-[10px] tracking-[0.3em] uppercase mt-1">Perfumes</span>
            </div>
          </Link>

          {/* Search Bar (Desktop Only) */}
          <NavbarSearch className="hidden lg:flex flex-1 w-full max-w-2xl" />

          {/* Actions (Account, Wishlist, Cart) */}
          <NavbarActions />
        </div>
        
        {/* Mobile Search Bar */}
        <NavbarSearch className="lg:hidden mt-4 bg-neutral-50 h-10" />
      </div>

      {/* Navigation Links */}
      <div className="border-t border-neutral-100 hidden lg:block">
        <div className="container mx-auto px-4 relative">
          <ul className="flex items-center justify-center gap-8 md:gap-16 text-xs font-medium tracking-widest uppercase text-neutral-600">
            <li className="py-4">
              <Link href="/offers" className="flex items-center gap-1 text-yellow-600 hover:text-yellow-700 transition-colors">
                <Zap className="h-4 w-4 fill-current" />
                Exclusive Offers
              </Link>
            </li>

            {/* MEN MEGA MENU */}
            <li className="group hover:text-black transition-colors cursor-pointer py-4">
              <Link href="/collections/mens">Men</Link>
              <MegaMenu type="mens" />
            </li>

            {/* WOMEN MEGA MENU */}
            <li className="group hover:text-black transition-colors cursor-pointer py-4">
              <Link href="/collections/womens">Women</Link>
              <MegaMenu type="womens" />
            </li>

            <li className="group hover:text-black transition-colors cursor-pointer py-4 relative">
              <Link href="/collections/deals">Best Sets</Link>
              <div className="absolute top-full left-1/2 -translate-x-1/2 bg-white text-black shadow-xl border border-neutral-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 w-56 z-50 transform translate-y-2 group-hover:translate-y-0 p-6 flex flex-col space-y-5">
                <Link href="/collections/deals" className="text-sm font-light hover:text-neutral-500 transition-colors capitalize">View All Sets</Link>
                <Link href="/collections/deals" className="text-sm font-light hover:text-neutral-500 transition-colors capitalize">Ramadan Specials</Link>
              </div>
            </li>
          </ul> 
        </div>
      </div>

      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </header>
  )
}
