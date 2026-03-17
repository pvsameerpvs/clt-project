"use client"

import { useEffect, useState } from "react"
import { getSiteSettings } from "@/lib/api"

export function NavbarTicker() {
  const [text, setText] = useState("")

  useEffect(() => {
    async function load() {
      const settings = await getSiteSettings()
      if (settings?.ticker_text) {
        setText(settings.ticker_text)
      }
    }
    load()
  }, [])

  if (!text.trim()) return null

  return (
    <div className="bg-black text-white text-[10px] md:text-xs py-2 overflow-hidden flex">
      <div className="animate-marquee whitespace-nowrap flex min-w-full">
        {/* Render multiple times for seamless scrolling */}
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className="mx-8 uppercase tracking-widest font-medium">
            {text}
          </span>
        ))}
      </div>
    </div>
  )
}
