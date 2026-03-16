"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { getSiteSettings } from "@/lib/api"

interface MegaMenuProps {
  type: 'mens' | 'womens'
}

export function MegaMenu({ type }: MegaMenuProps) {
  const [data, setData] = useState<any>(null)
  const href = `/collections/${type}`

  useEffect(() => {
    async function load() {
      const settings = await getSiteSettings()
      if (settings?.navigation?.[type]) {
        setData(settings.navigation[type])
      }
    }
    load()
  }, [type])

  if (!data) return null

  return (
    <div className="absolute top-full left-0 right-0 bg-white text-black shadow-2xl border-t border-neutral-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 transform translate-y-2 group-hover:translate-y-0 pb-10 pt-8 px-12">
      <div className="flex gap-12 w-full max-w-6xl mx-auto">
        {/* Category Column */}
        <div className="flex flex-col flex-1">
          <h3 className="text-black font-serif text-base tracking-wide uppercase mb-6 drop-shadow-sm">Shop By Category</h3>
          <div className="flex flex-col space-y-4">
            {data.categories.map((cat: string) => (
              <Link key={cat} href={href} className="text-sm font-light text-neutral-500 hover:text-black transition-colors capitalize">{cat}</Link>
            ))}
          </div>
        </div>

        {/* Notes Column */}
        <div className="flex flex-col flex-1">
          <h3 className="text-black font-serif text-base tracking-wide uppercase mb-6 drop-shadow-sm">Shop By Notes</h3>
          <div className="grid grid-cols-2 gap-6 w-full max-w-[220px]">
            {data.notes.map((note: any) => (
              <Link key={note.name} href={href} className="flex flex-col items-center gap-3 group/note">
                <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg shadow-black/20 group-hover/note:scale-105 transition-transform">
                  <Image src={note.image} alt={note.name} width={80} height={80} className="object-cover w-full h-full" />
                </div>
                <span className="text-xs font-medium text-neutral-600 capitalize">{note.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Banners Column */}
        <div className="flex flex-col gap-4 flex-[1.5]">
          {data.banners.map((banner: any) => (
            <Link key={banner.title} href={href} className="relative w-full h-[80px] rounded overflow-hidden group/banner block shadow-md">
              <Image src={banner.image} alt={banner.title} fill className="object-cover group-hover/banner:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-black/20 group-hover/banner:bg-black/10 transition-colors"></div>
              <div className="absolute inset-0 flex items-center p-6 text-2xl font-serif tracking-widest text-white drop-shadow-lg">
                {banner.title}
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  )
}
