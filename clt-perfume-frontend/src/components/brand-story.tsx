"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { getSiteSettings } from "@/lib/api"

export function BrandStory() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    async function load() {
      const settings = await getSiteSettings()
      if (settings?.brand_story) {
        setData(settings.brand_story)
      }
    }
    load()
  }, [])

  if (!data) return <div className="py-24 bg-neutral-900 h-96 animate-pulse" />

  return (
    <section className="py-24 bg-neutral-900 text-white overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="relative aspect-[3/4] md:aspect-square w-full rounded-2xl overflow-hidden">
            <Image
              src={data.image}
              alt="Brand philosophy imagery"
              fill
              className="object-cover grayscale contrast-125 hover:scale-105 transition-transform duration-700"
            />
          </div>
          
          <div className="space-y-8">
            <span className="text-xs uppercase tracking-[0.2em] text-neutral-400">Our Core Philosophy</span>
            <h2 
              className="text-4xl md:text-6xl font-serif font-light leading-tight"
              dangerouslySetInnerHTML={{ __html: data.title }}
            />
            <p className="text-neutral-300 text-lg font-light leading-relaxed max-w-md">
              {data.description}
            </p>
            
            <div className="grid grid-cols-2 gap-8 py-8 border-t border-white/10 mt-8">
              {data.features.map((feat: any, idx: number) => (
                <div key={idx}>
                  <h4 className="text-white text-xl font-serif mb-2">{feat.title}</h4>
                  <p className="text-neutral-500 text-sm">{feat.text}</p>
                </div>
              ))}
            </div>

            <Button variant="outline" className="bg-transparent text-white border-white hover:bg-white hover:text-black rounded-none px-8 py-6 uppercase tracking-widest text-xs transition-colors duration-300">
              Read Our Story
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
