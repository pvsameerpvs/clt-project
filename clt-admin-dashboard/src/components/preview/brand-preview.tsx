"use client"

import Image from "next/image"
import { Edit3 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BrandFeature {
  title: string
  text: string
}

interface BrandStory {
  image?: string
  title?: string
  description?: string
  features?: BrandFeature[]
}

interface BrandPreviewProps {
  story: BrandStory
  onEditClick: () => void
}

export function BrandPreview({ story, onEditClick }: BrandPreviewProps) {
  return (
    <div className="group relative">
      <section className="py-10 md:py-16 bg-neutral-900 text-white overflow-hidden rounded-[2.5rem]">
        <div className="mx-auto px-4 md:px-8 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src={story.image || "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=1000"}
                alt="Brand philosophy"
                fill
                className="object-cover grayscale contrast-125 transition-transform duration-700"
              />
            </div>
            
            <div className="space-y-6">
              <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">Our Core Philosophy</span>
              <h2 
                className="text-3xl md:text-5xl font-serif font-light leading-tight"
                dangerouslySetInnerHTML={{ __html: story.title || "The Scent of <br/> Unspoken Tales" }}
              />
              <p className="text-neutral-400 text-sm font-light leading-relaxed max-w-md">
                {story.description}
              </p>
              
              <div className="grid grid-cols-2 gap-6 py-6 border-t border-white/10 mt-6">
                {story.features?.map((feat, idx: number) => (
                  <div key={idx}>
                    <h4 className="text-white text-base font-serif mb-1">{feat.title}</h4>
                    <p className="text-neutral-500 text-[10px] leading-tight">{feat.text}</p>
                  </div>
                ))}
              </div>

              <Button variant="outline" className="bg-transparent text-white border-white/20 hover:bg-white hover:text-black rounded-none px-6 py-3 uppercase tracking-widest text-[10px] transition-colors">
                Read Our Story
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Edit Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-[2.5rem] z-20 pointer-events-none group-hover:pointer-events-auto">
         <Button 
            className="flex items-center gap-2 rounded-full bg-white px-8 py-6 text-black hover:bg-neutral-200 shadow-2xl scale-95 group-hover:scale-100 transition-all duration-300"
            onClick={onEditClick}
         >
            <Edit3 className="h-5 w-5" />
            <span className="font-bold uppercase tracking-widest text-[10px]">Edit Brand Story</span>
         </Button>
      </div>
    </div>
  )
}
