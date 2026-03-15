"use client"

import * as React from "react"
import Image from "next/image"
import Autoplay from "embla-carousel-autoplay"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"

const SLIDES = [
  {
    image: "/prfume-bannar-1.jpg",
    alt: "Luxury perfume bottle in dark setting",
    tagline: "An impression that lingers",
    headline: "Let Your Scent <br/> Speak First",
  },

  {
    image: "/prfume-bannar-2.jpg",
    alt: "Luxury perfume bottle in dark setting",
    tagline: "An impression that lingers",
    headline: "Let Your Scent <br/> Speak First",
  },
  {
    image: "/prfume-bannar-3.jpg",
    alt: "Elegant perfume aesthetic",
    tagline: "SOPHISTICATION REDEFINED",
    headline: "Essence of <br/> Pure Luxury",
  },
  {
    image: "/prfume-bannar-4.png",
    alt: "Modern fragrance collection",
    tagline: "TIMELESS ELEGANCE",
    headline: "Ramadan Signature  <br/> Offers",
  },
]

export function Hero() {
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false })
  )

  return (
    <section className="w-full px-4 md:px-6 pb-16">
      <div className="relative h-[70vh] min-h-[500px] w-full overflow-hidden rounded-[2rem] bg-neutral-900 shadow-2xl">
        <Carousel
          plugins={[plugin.current]}
          className="h-full w-full [&>div]:h-full"
          opts={{
            loop: true,
          }}
        >
          <CarouselContent className="h-full ml-0">
            {SLIDES.map((slide, index) => (
              <CarouselItem key={index} className="relative h-full w-full pl-0">
                
                {/* Background Image - Fits Exactly Like Before */}
                <div className="absolute inset-0 h-full w-full">
                  <Image
                    src={slide.image}
                    alt={slide.alt}
                    fill
                    className="object-cover object-bottom"
                    priority={index === 0}
                    sizes="100vw"
                  />
                  {/* Dark Overlay */}
                  <div className="absolute inset-0 bg-black/40" />
                </div>

                {/* Content Container - Flex Layout */}
                <div className="absolute inset-0 flex flex-col justify-between p-8 md:p-16 lg:p-24">
                  
                  {/* Top: Tagline */}
                  <div className="animate-in fade-in slide-in-from-top-4 duration-1000">
                    <span className="inline-block rounded-full border border-white/20 bg-white/10 px-6 py-2 text-sm text-neutral-200 backdrop-blur-md">
                      {slide.tagline}
                    </span>
                  </div>

                  {/* Center: Main Headline */}
                  <div className="flex animate-in fade-in slide-in-from-left-4 duration-1000 delay-200">
                    <h1 
                      className="max-w-4xl text-5xl font-thin uppercase leading-none tracking-tight text-white md:text-7xl lg:text-8xl"
                      dangerouslySetInnerHTML={{ __html: slide.headline }}
                    />
                  </div>

                  {/* Bottom: Call to Action */}
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                    <Button className="group flex h-14 items-center gap-4 rounded-full bg-white pl-8 pr-2 text-black transition-all hover:scale-105 hover:bg-neutral-200">
                      <span className="text-sm font-medium tracking-wide">
                        Discover The Scent
                      </span>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white transition-transform group-hover:rotate-[-45deg]">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </Button>
                  </div>

                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  )
}