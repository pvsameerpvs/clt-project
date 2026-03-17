"use client"

import * as React from "react"
import Image from "next/image"
import Autoplay from "embla-carousel-autoplay"
import { ArrowRight, Edit3 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"

export function HeroPreview({ slides, onEditClick }: { slides: any[], onEditClick?: () => void }) {
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false })
  )

  if (!slides || slides.length === 0) {
    return (
      <div className="h-[400px] bg-neutral-100 rounded-[2rem] flex items-center justify-center border-2 border-dashed border-neutral-300">
        <p className="text-neutral-400">No slides configured</p>
      </div>
    )
  }

  return (
    <div className="group relative">
      <div className="overflow-hidden rounded-[2rem] bg-neutral-900 shadow-xl">
        <div className="relative h-[300px] sm:h-[400px] md:h-[500px] w-full">
          <Carousel
            plugins={[plugin.current]}
            className="h-full w-full [&>div]:h-full"
            opts={{
              loop: true,
            }}
          >
            <CarouselContent className="h-full ml-0">
              {slides.map((slide: any, index: number) => (
                <CarouselItem key={index} className="relative h-full w-full pl-0">
                  {/* Background Image */}
                  <div className="absolute inset-0 h-full w-full">
                    <Image
                      src={slide.image || "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=1000"}
                      alt={slide.tagline || ""}
                      fill
                      className="object-cover object-bottom"
                      priority={index === 0}
                      sizes="100vw"
                    />
                    <div className="absolute inset-0 bg-black/40" />
                  </div>

                  {/* Content Container */}
                  <div className="absolute inset-0 flex flex-col justify-between p-8 md:p-12 lg:p-16">
                    <div className="animate-in fade-in slide-in-from-top-4 duration-700">
                      <span className="inline-block rounded-full border border-white/20 bg-white/10 px-6 py-2 text-xs text-neutral-200 backdrop-blur-md">
                        {slide.tagline}
                      </span>
                    </div>

                    <div className="flex animate-in fade-in slide-in-from-left-4 duration-700 delay-200">
                      <h1 
                        className="max-w-4xl text-4xl font-thin uppercase leading-none tracking-tight text-white md:text-5xl lg:text-6xl"
                        dangerouslySetInnerHTML={{ __html: slide.headline }}
                      />
                    </div>

                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                      <Button className="group flex h-12 items-center gap-4 rounded-full bg-white pl-6 pr-2 text-black transition-all hover:scale-105 hover:bg-neutral-200">
                        <span className="text-xs font-medium tracking-wide">
                          Discover The Scent
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white transition-transform group-hover:rotate-[-45deg]">
                          <ArrowRight className="h-3 w-3" />
                        </div>
                      </Button>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
      
      {/* Edit Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-[2rem] z-20 pointer-events-none group-hover:pointer-events-auto">
         <Button 
            className="flex items-center gap-2 rounded-full bg-white px-8 py-6 text-black hover:bg-neutral-200 shadow-2xl scale-95 group-hover:scale-100 transition-all duration-300"
            onClick={onEditClick}
         >
            <Edit3 className="h-5 w-5" />
            <span className="font-bold uppercase tracking-widest text-[10px]">Edit Hero Content</span>
         </Button>
      </div>
    </div>
  )
}
