"use client"

import { Facebook, Instagram, Twitter, Youtube, Linkedin } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { getSiteSettings } from "@/lib/api"

interface StoreInfo {
  name: string
  slogan: string
  description: string
  email: string
  phone: string
  address: string
  social_links: {
    instagram: string
    facebook: string
    twitter: string
    youtube: string
    linkedin: string
  }
}

export function Footer() {
  const [info, setInfo] = useState<StoreInfo | null>(null)

  useEffect(() => {
    async function load() {
      const settings = await getSiteSettings()
      if (settings?.global_store_info) {
        setInfo(settings.global_store_info)
      }
    }
    load()
  }, [])

  const socialLinks: StoreInfo["social_links"] = info?.social_links || {
    instagram: "",
    facebook: "",
    twitter: "",
    youtube: "",
    linkedin: "",
  }

  return (
    <footer className="bg-black text-white border-t border-neutral-900">
      <div className="container mx-auto px-4 md:px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 text-sm text-neutral-400">
          
          {/* Brand Info */}
          <div className="space-y-6 col-span-1 lg:col-span-2">
            <h3 className="text-2xl font-bold font-serif tracking-widest text-white mb-4">
              {info?.slogan || ""}
            </h3>
            <p className="max-w-md font-light leading-relaxed">
              {info?.description || ""}
            </p>
            
            {/* Social Media */}
            <div className="flex gap-4 pt-4">
              {socialLinks.instagram && (
                <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all">
                  <Instagram className="h-4 w-4" />
                  <span className="sr-only">Instagram</span>
                </a>
              )}
              {socialLinks.facebook && (
                <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all">
                  <Facebook className="h-4 w-4" />
                  <span className="sr-only">Facebook</span>
                </a>
              )}
              {socialLinks.twitter && (
                <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all">
                  <Twitter className="h-4 w-4" />
                  <span className="sr-only">Twitter</span>
                </a>
              )}
              {socialLinks.youtube && (
                <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all">
                  <Youtube className="h-4 w-4" />
                  <span className="sr-only">YouTube</span>
                </a>
              )}
              {socialLinks.linkedin && (
                <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all">
                  <Linkedin className="h-4 w-4" />
                  <span className="sr-only">LinkedIn</span>
                </a>
              )}
            </div>
          </div>
          
          {/* Shop */}
          <div className="space-y-6">
            <h4 className="font-semibold text-white uppercase tracking-widest text-xs">Shop</h4>
            <ul className="space-y-4">
              <li><Link href="/collections/mens" className="hover:text-white transition-colors">Men&apos;s Collection</Link></li>
              <li><Link href="/collections/womens" className="hover:text-white transition-colors">Women&apos;s Collection</Link></li>
              <li><Link href="/collections/deals" className="hover:text-white transition-colors">Best Sets</Link></li>
              <li><Link href="/offers" className="hover:text-white transition-colors">Exclusive Offers</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-6">
            <h4 className="font-semibold text-white uppercase tracking-widest text-xs">Company</h4>
            <ul className="space-y-4">
              <li><Link href="#" className="hover:text-white transition-colors">Our Story</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Ingredients</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Sustainability</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Apps */}
          <div className="space-y-6">
            <h4 className="font-semibold text-white uppercase tracking-widest text-xs">Download Our App</h4>
            <p className="text-xs font-light leading-relaxed mb-4">Shop anytime, anywhere with the {info?.name || ""} app. Available on iOS and Android.</p>
            <div className="flex flex-col gap-3">
              <a href="#" className="inline-block hover:scale-105 transition-transform origin-left">
                <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 w-[160px] shadow-sm">
                  <svg viewBox="0 0 384 512" className="w-6 h-6 fill-white"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
                  <div className="flex flex-col">
                    <span className="text-[10px] leading-none text-neutral-400">Download on the</span>
                    <span className="text-sm font-semibold leading-none text-white mt-1">App Store</span>
                  </div>
                </div>
              </a>
              <a href="#" className="inline-block hover:scale-105 transition-transform origin-left">
                <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 w-[160px] shadow-sm">
                  <svg viewBox="0 0 512 512" className="w-6 h-6 fill-white"><path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/></svg>
                  <div className="flex flex-col">
                    <span className="text-[10px] leading-none text-neutral-400">GET IT ON</span>
                    <span className="text-sm font-semibold leading-none text-white mt-1">Google Play</span>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-neutral-900 mt-16 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>&copy; {new Date().getFullYear()} {info?.name || ""}. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Shipping & Returns</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
