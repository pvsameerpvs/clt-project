"use client"

import Image from "next/image"
import { Edit3, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { renderLineBreaks } from "@/lib/safe-html"

interface CuratedCollectionPreviewItem {
  href: string
  image: string
  subtitle: string
  title: string
  action: string
  product_slugs?: string[]
}

interface CollectionsPreviewProps {
  collections: CuratedCollectionPreviewItem[]
  productNameBySlug?: Record<string, string>
  onEditClick: () => void
}

export function CollectionsPreview({ collections, productNameBySlug = {}, onEditClick }: CollectionsPreviewProps) {
  return (
    <div className="group relative">
      <section className="py-12 bg-white rounded-3xl border border-neutral-100 px-6">
        <div className="flex flex-col mb-10">
          <h2 className="text-3xl md:text-4xl font-serif font-medium tracking-tight text-neutral-900 mb-2">
            Curated Selections
          </h2>
          <p className="text-neutral-500 max-w-lg font-light text-sm">
            Discover our most sought-after fragrances, tailored for every preference and occasion.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:h-[500px]">
          {collections.slice(0, 3).map((col, idx) => (
            <div key={idx} className="relative group/card overflow-hidden rounded-2xl block h-[350px] md:h-full w-full">
               <div className="absolute inset-0 z-0">
                  <Image 
                    src={col.image || "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=1000"}
                    alt={col.subtitle || ""}
                    fill
                    className="object-cover transition-transform duration-700 group-hover/card:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
               </div>
               <div className="relative z-10 w-full h-full flex flex-col justify-end p-6">
                  <span className="text-white/70 text-[9px] font-medium uppercase tracking-[0.2em] mb-2">{col.subtitle}</span>
                  <h3 className="text-2xl font-serif text-white mb-4 leading-tight">
                    {renderLineBreaks(col.title)}
                  </h3>
                  {Array.isArray(col.product_slugs) && col.product_slugs.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {col.product_slugs.slice(0, 2).map((slug) => (
                        <span
                          key={`${idx}-${slug}`}
                          className="rounded-full border border-white/30 bg-black/35 px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-white/90"
                        >
                          {productNameBySlug[slug] || slug}
                        </span>
                      ))}
                      {col.product_slugs.length > 2 && (
                        <span className="rounded-full border border-white/30 bg-black/35 px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-white/90">
                          +{col.product_slugs.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center text-white text-[10px] items-center gap-2">
                     <span className="uppercase tracking-widest font-medium border-b border-white/30 pb-1">{col.action || "Shop Now"}</span>
                     <ArrowRight className="h-3 w-3" />
                  </div>
               </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* Edit Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-3xl z-20 pointer-events-none group-hover:pointer-events-auto">
         <Button 
            className="flex items-center gap-2 rounded-full bg-white px-8 py-6 text-black hover:bg-neutral-200 shadow-2xl scale-95 group-hover:scale-100 transition-all duration-300"
            onClick={onEditClick}
         >
            <Edit3 className="h-5 w-5" />
            <span className="font-bold uppercase tracking-widest text-[10px]">Edit Collections</span>
         </Button>
      </div>
    </div>
  )
}
