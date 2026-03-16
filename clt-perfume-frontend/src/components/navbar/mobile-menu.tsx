"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { X, ChevronRight, Zap, User } from "lucide-react"
import { getSiteSettings } from "@/lib/api"

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const [activeMenu, setActiveMenu] = useState<'main' | 'mens' | 'womens'>('main')
  const [navData, setNavData] = useState<any>(null)

  useEffect(() => {
    async function load() {
      const settings = await getSiteSettings()
      if (settings?.navigation) {
        setNavData(settings.navigation)
      }
    }
    load()
  }, [])

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/50 z-[100] lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      ></div>

      <div 
        className={`fixed top-0 left-0 bottom-0 w-[85vw] max-w-sm bg-white z-[101] lg:hidden flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between p-5 border-b border-neutral-100">
          <button 
            onClick={() => setActiveMenu('main')}
            className={`flex items-center gap-2 text-sm text-neutral-500 font-medium ${activeMenu === 'main' ? 'invisible' : 'visible'}`}
          >
             <ChevronRight className="w-4 h-4 rotate-180" /> Back
          </button>
          
          <button onClick={onClose} className="p-2 -mr-2 text-neutral-400 hover:text-black rounded-full hover:bg-neutral-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto w-full">
          {/* Main Menu */}
          <div className={`w-full flex flex-col p-6 ${activeMenu === 'main' ? 'block animate-in fade-in slide-in-from-left-4 duration-300' : 'hidden'}`}>
            <div className="flex flex-col gap-6">
              <button 
                onClick={() => setActiveMenu('mens')}
                className="flex items-center justify-between py-2 text-base font-serif uppercase tracking-widest border-b border-neutral-100 pb-4"
              >
                Men <ChevronRight className="w-5 h-5 text-neutral-400" />
              </button>
              
              <button 
                onClick={() => setActiveMenu('womens')}
                className="flex items-center justify-between py-2 text-base font-serif uppercase tracking-widest border-b border-neutral-100 pb-4"
              >
                Women <ChevronRight className="w-5 h-5 text-neutral-400" />
              </button>
              
              <Link onClick={onClose} href="/collections/deals" className="py-2 text-base font-serif uppercase tracking-widest border-b border-neutral-100 pb-4">
                Best Sets
              </Link>
              
              <Link onClick={onClose} href="/offers" className="py-2 text-base font-serif uppercase tracking-widest border-b border-neutral-100 pb-4 text-amber-600 flex items-center gap-2">
                <Zap className="w-4 h-4 fill-current" /> Exclusive Offers
              </Link>
            </div>

            <div className="mt-8 pt-8 border-t border-neutral-100 space-y-6 pb-24">
              <Link onClick={onClose} href="/profile" className="flex items-center gap-3 text-sm uppercase tracking-wider text-neutral-700 font-bold">
                <User className="w-5 h-5" /> Account Center
              </Link>
            </div>
          </div>

          {/* Submenus */}
          {['mens', 'womens'].map((gender: any) => (
            <div key={gender} className={`w-full flex flex-col p-6 ${activeMenu === gender ? 'block animate-in fade-in slide-in-from-right-4 duration-100' : 'hidden'}`}>
              <h3 className="font-serif text-xl tracking-widest uppercase mb-8 pb-4 border-b border-neutral-100 capitalize">{gender}</h3>
              <div className="space-y-5">
                {navData?.[gender]?.categories?.map((cat: string) => (
                   <Link key={cat} onClick={onClose} href={`/collections/${gender}`} className="block text-sm text-neutral-600 uppercase tracking-wider py-1 hover:text-black">
                     {cat}
                   </Link>
                ))}
                {(!navData?.[gender]?.categories) && <p className="text-neutral-400 text-xs italic">Manage categories in Admin Dashboard</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
