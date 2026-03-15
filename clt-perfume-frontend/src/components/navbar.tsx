
"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useCart } from "@/contexts/cart-context"
import { useWishlist } from "@/contexts/wishlist-context"
import { 
  User, 
  Heart, 
  ShoppingBag, 
  Search, 
  Zap,
  Menu,
  X,
  ChevronRight,
  LayoutDashboard,
  LogOut
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export function Navbar() {
  const { totalItems } = useCart()
  const { items: wishlistItems } = useWishlist()
  const { user, isAdmin } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeMobileMenu, setActiveMobileMenu] = useState<'main' | 'mens' | 'womens'>('main')
  const supabase = createClient()
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <header className="w-full bg-white z-50 relative">
      {/* Top Banner Ticker */}
      {/* Top Banner Ticker */}
      <div className="bg-black text-white text-[10px] md:text-xs py-2 overflow-hidden flex">
        <div className="animate-marquee whitespace-nowrap flex min-w-full">
          <span className="mx-4">RAMADAN SPECIAL: 30% OFF ON LUXURY PERFUMES ✨ NOW AVAILABLE UNDER 49!</span>
          <span className="mx-4">RAMADAN SPECIAL: 30% OFF ON LUXURY PERFUMES ✨ NOW AVAILABLE UNDER 49!</span>
          <span className="mx-4">RAMADAN SPECIAL: 30% OFF ON LUXURY PERFUMES ✨ NOW AVAILABLE UNDER 49!</span>
          <span className="mx-4">RAMADAN SPECIAL: 30% OFF ON LUXURY PERFUMES ✨ NOW AVAILABLE UNDER 49!</span>
          
          {/* Duplicate for seamless loop */}
          <span className="mx-4">RAMADAN SPECIAL: 30% OFF ON LUXURY PERFUMES ✨ NOW AVAILABLE UNDER 49!</span>
          <span className="mx-4">RAMADAN SPECIAL: 30% OFF ON LUXURY PERFUMES ✨ NOW AVAILABLE UNDER 49!</span>
          <span className="mx-4">RAMADAN SPECIAL: 30% OFF ON LUXURY PERFUMES ✨ NOW AVAILABLE UNDER 49!</span>
          <span className="mx-4">RAMADAN SPECIAL: 30% OFF ON LUXURY PERFUMES ✨ NOW AVAILABLE UNDER 49!</span>
        </div>
      </div>

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
          <div className="hidden lg:flex flex-1 w-full max-w-2xl relative">
            <Input 
              type="search" 
              placeholder="Search for product or brand" 
              className="w-full rounded-full pl-6 pr-12 h-12 border-neutral-300 focus-visible:ring-black/5 text-neutral-600 font-light"
            />
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 h-5 w-5" />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 md:gap-6 flex-shrink-0 text-neutral-600">
            {user ? (
              <div className="group relative flex flex-col items-center gap-1 cursor-pointer">
                <User className="h-5 w-5 text-black" />
                <span className="text-[10px] uppercase tracking-wide">Account</span>
                <div className="absolute top-full right-0 mt-2 w-48 bg-white shadow-xl border border-neutral-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[60] p-4 flex flex-col gap-3">
                  <Link href="/dashboard" className="text-[10px] uppercase tracking-widest hover:text-black">My Profile</Link>
                  {isAdmin && (
                    <Link href="/admin" className="text-[10px] uppercase tracking-widest text-amber-600 hover:text-amber-700 flex items-center gap-2">
                      <LayoutDashboard className="h-3 w-3" /> Admin Panel
                    </Link>
                  )}
                  <button onClick={handleSignOut} className="text-[10px] uppercase tracking-widest text-red-500 hover:text-red-600 text-left flex items-center gap-2 pt-2 border-t border-neutral-100">
                    <LogOut className="h-3 w-3" /> Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Link href="/login" className="flex flex-col items-center gap-1 hover:text-black transition-colors">
                <User className="h-5 w-5" />
                <span className="text-[10px] uppercase tracking-wide">Sign In</span>
              </Link>
            )}

            <Link href="/wishlist" className="flex flex-col items-center gap-1 hover:text-black transition-colors relative">
              <div className="relative">
                <Heart className="h-5 w-5 md:h-5 md:w-5" />
                {wishlistItems.length > 0 && (
                  <Badge className="absolute -top-1.5 -right-1.5 md:-top-1 md:-right-1 h-3.5 w-3.5 md:h-3 md:w-3 p-0 flex items-center justify-center bg-black text-white rounded-full text-[9px] md:text-[8px] border border-white">
                    {wishlistItems.length}
                  </Badge>
                )}
              </div>
              <span className="hidden lg:block text-[10px] uppercase tracking-wide">Wishlist</span>
            </Link>

            <Link href="/cart" className="flex flex-col items-center gap-1 hover:text-black transition-colors relative">
              <div className="relative">
                <ShoppingBag className="h-5 w-5 md:h-5 md:w-5" />
                {totalItems > 0 && (
                  <Badge className="absolute -top-1.5 -right-1.5 md:-top-1 md:-right-1 h-3.5 w-3.5 md:h-3 md:w-3 p-0 flex items-center justify-center bg-black text-white rounded-full text-[9px] md:text-[8px] border border-white">
                    {totalItems}
                  </Badge>
                )}
              </div>
              <span className="hidden lg:block text-[10px] uppercase tracking-wide">My Bag</span>
            </Link>
          </div>
        </div>
        
        {/* Mobile Search Bar - Shown below logo on mobile */}
        <div className="lg:hidden mt-4 relative w-full">
           <Input 
             type="search" 
             placeholder="Search for product or brand" 
             className="w-full rounded-full pl-5 pr-10 h-10 border-neutral-300 focus-visible:ring-black/5 text-sm font-light bg-neutral-50"
           />
           <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
        </div>
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
              <div className="absolute top-full left-0 right-0 bg-white text-black shadow-2xl border-t border-neutral-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 transform translate-y-2 group-hover:translate-y-0 pb-10 pt-8 px-12">
                <div className="flex gap-12 w-full max-w-6xl mx-auto">
                  
                  {/* Category Column */}
                  <div className="flex flex-col flex-1">
                    <h3 className="text-black font-serif text-base tracking-wide uppercase mb-6 drop-shadow-sm">Shop By Category</h3>
                    <div className="flex flex-col space-y-4">
                      <Link href="/collections/mens" className="text-sm font-light text-neutral-500 hover:text-black transition-colors capitalize">Men Perfumes</Link>
                      <Link href="/collections/mens" className="text-sm font-light text-neutral-500 hover:text-black transition-colors capitalize">Best Seller For Men</Link>
                      <Link href="/collections/mens" className="text-sm font-light text-neutral-500 hover:text-black transition-colors capitalize">Gift Sets For Men</Link>
                      <Link href="/collections/mens" className="text-sm font-light text-neutral-500 hover:text-black transition-colors capitalize">Arabic Perfume</Link>
                      <Link href="/collections/mens" className="text-sm font-light text-neutral-500 hover:text-black transition-colors capitalize">Niche Perfumes</Link>
                      <Link href="/collections/mens" className="text-sm font-light text-neutral-500 hover:text-black transition-colors capitalize">Inspired Perfumes</Link>
                    </div>
                  </div>



                  {/* Notes Column */}
                  <div className="flex flex-col flex-1">
                     <h3 className="text-black font-serif text-base tracking-wide uppercase mb-6 drop-shadow-sm">Shop By Notes</h3>
                     <div className="grid grid-cols-2 gap-6 w-full max-w-[220px]">
                        <Link href="/collections/mens" className="flex flex-col items-center gap-3 group/note">
                           <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg shadow-black/20 group-hover/note:scale-105 transition-transform">
                              <Image src="/prfume-bannar-2.jpg" alt="Woody" width={80} height={80} className="object-cover w-full h-full" />
                           </div>
                           <span className="text-xs font-medium text-neutral-600 capitalize">Woody</span>
                        </Link>
                        <Link href="/collections/mens" className="flex flex-col items-center gap-3 group/note">
                           <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg shadow-black/20 group-hover/note:scale-105 transition-transform">
                              <Image src="/prfume-bannar-4.png" alt="Spicy" width={80} height={80} className="object-cover w-full h-full" />
                           </div>
                           <span className="text-xs font-medium text-neutral-600 capitalize">Spicy</span>
                        </Link>
                        <Link href="/collections/mens" className="flex flex-col items-center gap-3 group/note">
                           <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg shadow-black/20 group-hover/note:scale-105 transition-transform">
                              <Image src="/perfume/midnight-perfume1.png" alt="Fresh" width={80} height={80} className="object-cover w-full h-full" />
                           </div>
                           <span className="text-xs font-medium text-neutral-600 capitalize">Fresh</span>
                        </Link>
                        <Link href="/collections/mens" className="flex flex-col items-center gap-3 group/note">
                           <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg shadow-black/20 group-hover/note:scale-105 transition-transform">
                              <Image src="/perfume/noir-perfume1.png" alt="Citrus" width={80} height={80} className="object-cover w-full h-full bg-neutral-100" />
                           </div>
                           <span className="text-xs font-medium text-neutral-600 capitalize">Citrus</span>
                        </Link>
                     </div>
                  </div>

                  {/* Banners Column */}
                  <div className="flex flex-col gap-4 flex-[1.5]">
                     <Link href="/collections/mens" className="relative w-full h-[80px] rounded overflow-hidden group/banner block shadow-md">
                        <Image src="/Philosophy.png" alt="Men Banner 1" fill className="object-cover group-hover/banner:scale-105 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-black/20 group-hover/banner:bg-black/10 transition-colors"></div>
                        <div className="absolute inset-0 flex items-center p-6 text-white text-2xl font-serif tracking-widest drop-shadow-lg">NEW ARRIVALS</div>
                     </Link>
                     <Link href="/collections/mens" className="relative w-full h-[80px] rounded overflow-hidden group/banner block shadow-md">
                        <Image src="/prfume-bannar-1.jpg" alt="Men Banner 2" fill className="object-cover group-hover/banner:scale-105 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-black/40 group-hover/banner:bg-black/20 transition-colors"></div>
                        <div className="absolute inset-0 flex items-center p-6 text-white text-2xl font-serif tracking-widest drop-shadow-lg opacity-90">SIGNATURE</div>
                     </Link>
                     <Link href="/collections/mens" className="relative w-full h-[80px] rounded overflow-hidden group/banner block shadow-md">
                        <Image src="/curated-perfume-men.png" alt="Men Banner 3" fill className="object-cover group-hover/banner:scale-105 transition-transform duration-700 grayscale hidden" />
                        <div className="w-full h-full bg-gradient-to-r from-neutral-800 to-neutral-900 absolute inset-0"></div>
                        <div className="absolute top-0 right-0 bottom-0 w-1/2 opacity-30 bg-[url('/prfume-bannar-2.jpg')] bg-cover mix-blend-overlay"></div>
                        <div className="absolute inset-0 flex items-center p-6 text-white text-2xl font-serif tracking-widest drop-shadow-lg">CLE ORIGINAL</div>
                     </Link>
                  </div>

                </div>
              </div>
            </li>


            {/* WOMEN MEGA MENU */}
            <li className="group hover:text-black transition-colors cursor-pointer py-4">
              <Link href="/collections/womens">Women</Link>
              <div className="absolute top-full left-0 right-0 bg-white text-black shadow-2xl border-t border-neutral-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 transform translate-y-2 group-hover:translate-y-0 pb-10 pt-8 px-12">
                <div className="flex gap-12 w-full max-w-6xl mx-auto">
                  
                  {/* Category Column */}
                  <div className="flex flex-col flex-1">
                    <h3 className="text-black font-serif text-base tracking-wide uppercase mb-6 drop-shadow-sm">Shop By Category</h3>
                    <div className="flex flex-col space-y-4">
                      <Link href="/collections/womens" className="text-sm font-light text-neutral-500 hover:text-black transition-colors capitalize">Women Perfumes</Link>
                      <Link href="/collections/womens" className="text-sm font-light text-neutral-500 hover:text-black transition-colors capitalize">Best Seller For Women</Link>
                      <Link href="/collections/womens" className="text-sm font-light text-neutral-500 hover:text-black transition-colors capitalize">Gift Sets For Women</Link>
                      <Link href="/collections/womens" className="text-sm font-light text-neutral-500 hover:text-black transition-colors capitalize">Cosmetics</Link>
                      <Link href="/collections/womens" className="text-sm font-light text-neutral-500 hover:text-black transition-colors capitalize">Body Mist</Link>
                      <Link href="/collections/womens" className="text-sm font-light text-neutral-500 hover:text-black transition-colors capitalize">Arabic Perfume</Link>
                      <Link href="/collections/womens" className="text-sm font-light text-neutral-500 hover:text-black transition-colors capitalize">Niche Perfumes</Link>
                    </div>
                  </div>



                  {/* Notes Column */}
                  <div className="flex flex-col flex-1">
                     <h3 className="text-black font-serif text-base tracking-wide uppercase mb-6 drop-shadow-sm">Shop By Notes</h3>
                     <div className="grid grid-cols-2 gap-6 w-full max-w-[220px]">
                        <Link href="/collections/womens" className="flex flex-col items-center gap-3 group/note">
                           <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg shadow-red-900/20 group-hover/note:scale-105 transition-transform border border-neutral-100">
                              <Image src="/prfume-bannar-3.jpg" alt="Fruity" width={80} height={80} className="object-cover w-full h-full" />
                           </div>
                           <span className="text-xs font-medium text-neutral-600 capitalize">Fruity</span>
                        </Link>
                        <Link href="/collections/womens" className="flex flex-col items-center gap-3 group/note">
                           <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg shadow-pink-900/10 group-hover/note:scale-105 transition-transform border border-neutral-100">
                              <Image src="/prfume-bannar-2.jpg" alt="Floral" width={80} height={80} className="object-cover w-full h-full" />
                           </div>
                           <span className="text-xs font-medium text-neutral-600 capitalize">Floral</span>
                        </Link>
                        <Link href="/collections/womens" className="flex flex-col items-center gap-3 group/note">
                           <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg shadow-red-900/20 group-hover/note:scale-105 transition-transform border border-neutral-100">
                              <Image src="/perfume/elan-perfume1.png" alt="Sweet" width={80} height={80} className="object-cover w-full h-full bg-neutral-100" />
                           </div>
                           <span className="text-xs font-medium text-neutral-600 capitalize">Sweet</span>
                        </Link>
                        <Link href="/collections/womens" className="flex flex-col items-center gap-3 group/note">
                           <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg shadow-pink-900/10 group-hover/note:scale-105 transition-transform border border-neutral-100">
                              <Image src="/perfume/first-dance1.png" alt="Musk" width={80} height={80} className="object-cover w-full h-full bg-neutral-100" />
                           </div>
                           <span className="text-xs font-medium text-neutral-600 capitalize">Musk</span>
                        </Link>
                     </div>
                  </div>

                  {/* Banners Column */}
                  <div className="flex flex-col gap-4 flex-[1.5]">
                     <Link href="/collections/womens" className="relative w-full h-[80px] rounded overflow-hidden group/banner block shadow-md">
                        <Image src="/Philosophy.png" alt="Best Sellers" fill className="object-cover group-hover/banner:scale-105 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-white/10 group-hover/banner:bg-white/0 transition-colors"></div>
                        <div className="absolute inset-0 flex items-center px-8 text-black text-2xl font-serif tracking-widest drop-shadow-xl" style={{textShadow: "2px 2px 10px rgba(255,255,255,0.7)"}}>BEST SELLERS</div>
                     </Link>
                     <Link href="/collections/womens" className="relative w-full h-[80px] rounded overflow-hidden group/banner block shadow-md">
                        <Image src="/prfume-bannar-4.png" alt="Gift Sets" fill className="object-cover group-hover/banner:scale-105 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-amber-900/40 group-hover/banner:bg-amber-900/20 transition-colors"></div>
                        <div className="absolute inset-0 flex items-center p-6 text-white text-2xl font-serif tracking-widest drop-shadow-lg">GIFT SETS</div>
                     </Link>
                     <Link href="/collections/womens" className="relative w-full h-[80px] rounded overflow-hidden group/banner block shadow-md">
                        <Image src="/prfume-bannar-3.jpg" alt="CLE Original" fill className="object-cover group-hover/banner:scale-105 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-yellow-900/40 group-hover/banner:bg-yellow-900/20 transition-colors"></div>
                        <div className="absolute inset-0 flex items-center p-6 text-white text-2xl font-serif tracking-widest drop-shadow-lg">CLE ORIGINAL</div>
                     </Link>
                  </div>

                </div>
              </div>
            </li>


            <li className="group hover:text-black transition-colors cursor-pointer py-4 relative">
              <Link href="/collections/deals">Best Sets</Link>
              <div className="absolute top-full left-1/2 -translate-x-1/2 bg-white text-black shadow-xl border border-neutral-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 w-56 z-50 transform translate-y-2 group-hover:translate-y-0">
                <div className="flex flex-col p-6 space-y-5">
                  <Link href="/collections/deals" className="text-sm font-light hover:text-neutral-500 transition-colors capitalize">View All Sets</Link>
                  <Link href="/collections/deals" className="text-sm font-light hover:text-neutral-500 transition-colors capitalize">Travel Sizes</Link>
                  <Link href="/collections/deals" className="text-sm font-light hover:text-neutral-500 transition-colors capitalize">Discovery Bundles</Link>
                  <div className="w-full h-px bg-neutral-100 my-2"></div>
                  <Link href="/collections/deals" className="text-sm font-light text-red-600 hover:text-red-700 transition-colors capitalize">Ramadan Specials</Link>
                </div>
              </div>
            </li>
          </ul> 
        </div>
      </div>

      {/* Mobile Offcanvas Menu */}
      <div 
        className={`fixed inset-0 bg-black/50 z-[100] lg:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>

      <div 
        className={`fixed top-0 left-0 bottom-0 w-[85vw] max-w-sm bg-white z-[101] lg:hidden flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Mobile Header Menu */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-100">
          <button 
            onClick={() => setActiveMobileMenu('main')}
            className={`flex items-center gap-2 text-sm text-neutral-500 font-medium ${activeMobileMenu === 'main' ? 'invisible' : 'visible'}`}
          >
             <ChevronRight className="w-4 h-4 rotate-180" /> Back
          </button>
          
          <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 -mr-2 text-neutral-400 hover:text-black rounded-full hover:bg-neutral-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Menu Content Container */}
        <div className="flex-1 overflow-y-auto w-full">
          
          {/* Main Mobile Menu */}
          <div className={`w-full flex flex-col p-6 ${activeMobileMenu === 'main' ? 'block animate-in fade-in slide-in-from-left-4 duration-300' : 'hidden'}`}>
            <div className="flex flex-col gap-6">
              <button 
                onClick={() => setActiveMobileMenu('mens')}
                className="flex items-center justify-between py-2 text-base font-serif uppercase tracking-widest border-b border-neutral-100 pb-4"
              >
                Men
                <ChevronRight className="w-5 h-5 text-neutral-400" />
              </button>
              
              <button 
                onClick={() => setActiveMobileMenu('womens')}
                className="flex items-center justify-between py-2 text-base font-serif uppercase tracking-widest border-b border-neutral-100 pb-4"
              >
                Women
                <ChevronRight className="w-5 h-5 text-neutral-400" />
              </button>
              
              <Link onClick={() => setIsMobileMenuOpen(false)} href="/collections/deals" className="py-2 text-base font-serif uppercase tracking-widest border-b border-neutral-100 pb-4">
                Best Sets
              </Link>
              
              <Link onClick={() => setIsMobileMenuOpen(false)} href="/offers" className="py-2 text-base font-serif uppercase tracking-widest border-b border-neutral-100 pb-4 text-yellow-600 flex items-center gap-2">
                <Zap className="w-4 h-4 fill-current" /> Exclusive Offers
              </Link>
            </div>

            <div className="mt-8 pt-8 border-t border-neutral-100 space-y-6 pb-24">
              <Link onClick={() => setIsMobileMenuOpen(false)} href="/login" className="flex items-center gap-3 text-sm uppercase tracking-wider text-neutral-700">
                <User className="w-5 h-5" /> Sign In / Register
              </Link>
            </div>
          </div>

          {/* Men's Submenu */}
          <div className={`w-full flex flex-col p-6 ${activeMobileMenu === 'mens' ? 'block animate-in fade-in slide-in-from-right-4 duration-300' : 'hidden'}`}>
            <h3 className="font-serif text-xl tracking-widest uppercase mb-8 pb-4 border-b border-neutral-100">Men</h3>
            
            <div className="space-y-5">
              <Link onClick={() => setIsMobileMenuOpen(false)} href="/collections/mens" className="block text-sm text-neutral-600 uppercase tracking-wider py-1">Men Perfumes</Link>
              <Link onClick={() => setIsMobileMenuOpen(false)} href="/collections/mens" className="block text-sm text-neutral-600 uppercase tracking-wider py-1">Best Seller For Men</Link>
              <Link onClick={() => setIsMobileMenuOpen(false)} href="/collections/mens" className="block text-sm text-neutral-600 uppercase tracking-wider py-1">Gift Sets For Men</Link>
              <Link onClick={() => setIsMobileMenuOpen(false)} href="/collections/mens" className="block text-sm text-neutral-600 uppercase tracking-wider py-1">Arabic Perfume</Link>
              <Link onClick={() => setIsMobileMenuOpen(false)} href="/collections/mens" className="block text-sm text-neutral-600 uppercase tracking-wider py-1">Niche Perfumes</Link>
            </div>

            <div className="mt-8 pt-8 border-t border-neutral-100 pb-24">
              <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-[0.2em] mb-4">Featured</h4>
              <Link onClick={() => setIsMobileMenuOpen(false)} href="/collections/mens" className="block aspect-[21/9] min-h-[120px] w-full relative rounded-lg overflow-hidden group">
                 <Image src="/Philosophy.png" alt="Men's Collection" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                 <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <span className="text-white font-serif tracking-widest uppercase drop-shadow-md">New Arrivals</span>
                 </div>
              </Link>
            </div>
          </div>

          {/* Women's Submenu */}
          <div className={`w-full flex flex-col p-6 ${activeMobileMenu === 'womens' ? 'block animate-in fade-in slide-in-from-right-4 duration-300' : 'hidden'}`}>
            <h3 className="font-serif text-xl tracking-widest uppercase mb-8 pb-4 border-b border-neutral-100">Women</h3>
            
            <div className="space-y-5">
              <Link onClick={() => setIsMobileMenuOpen(false)} href="/collections/womens" className="block text-sm text-neutral-600 uppercase tracking-wider py-1">Women Perfumes</Link>
              <Link onClick={() => setIsMobileMenuOpen(false)} href="/collections/womens" className="block text-sm text-neutral-600 uppercase tracking-wider py-1">Best Seller For Women</Link>
              <Link onClick={() => setIsMobileMenuOpen(false)} href="/collections/womens" className="block text-sm text-neutral-600 uppercase tracking-wider py-1">Gift Sets For Women</Link>
              <Link onClick={() => setIsMobileMenuOpen(false)} href="/collections/womens" className="block text-sm text-neutral-600 uppercase tracking-wider py-1">Cosmetics</Link>
              <Link onClick={() => setIsMobileMenuOpen(false)} href="/collections/womens" className="block text-sm text-neutral-600 uppercase tracking-wider py-1">Arabic Perfume</Link>
            </div>

            <div className="mt-8 pt-8 border-t border-neutral-100 pb-24">
              <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-[0.2em] mb-4">Featured</h4>
              <Link onClick={() => setIsMobileMenuOpen(false)} href="/collections/womens" className="block aspect-[21/9] min-h-[120px] w-full relative rounded-lg overflow-hidden group">
                 <Image src="/prfume-bannar-4.png" alt="Women's Collection" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                 <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <span className="text-white font-serif tracking-widest uppercase drop-shadow-md">Gift Sets</span>
                 </div>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </header>
  )
}
