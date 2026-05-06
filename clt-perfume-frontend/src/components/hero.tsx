"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import Autoplay from "embla-carousel-autoplay"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"

import { getSiteSettings } from "@/lib/api"
import { renderLineBreaks } from "@/lib/safe-html"

interface HeroSlide {
  image: string
  tagline: string
  headline: string
  href?: string | null
}

interface HeroProps {
  initialSlides?: HeroSlide[]
}

export function Hero({ initialSlides }: HeroProps) {
  const [slides, setSlides] = React.useState<HeroSlide[]>(initialSlides ?? [])
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false })
  )

  React.useEffect(() => {
    if (initialSlides !== undefined) return

    async function load() {
      const settings = await getSiteSettings()
      if (settings?.hero_slides) {
        setSlides(settings.hero_slides)
      }
    }
    load()
  }, [initialSlides])

  if (slides.length === 0) return <div className="h-[70vh] bg-neutral-900 rounded-[2rem] mx-4 animate-pulse mb-16" />


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
            {slides.map((slide: HeroSlide, index: number) => (
              <CarouselItem key={index} className="relative h-full w-full pl-0">
                
                {/* Background Image - Fits Exactly Like Before */}
                <div className="absolute inset-0 h-full w-full">
                  <Image
                    src={slide.image}
                    alt={slide.tagline}
                    fill

                    className="object-cover object-[75%_center] md:object-center"
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
                    <h1 className="max-w-4xl text-5xl font-thin uppercase leading-none tracking-tight text-white md:text-7xl lg:text-8xl">
                      {renderLineBreaks(slide.headline)}
                    </h1>
                  </div>

                  {/* Bottom: Call to Action */}
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                    <Link href={getHeroHref(slide.href)}>
                      <Button className="group flex h-14 items-center gap-4 rounded-full bg-white pl-8 pr-2 text-black transition-all hover:scale-105 hover:bg-neutral-200">
                        <span className="text-sm font-medium tracking-wide">
                          Discover The Scent
                        </span>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white transition-transform group-hover:rotate-[-45deg]">
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </Button>
                    </Link>
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

function getHeroHref(href?: string | null) {
  const value = typeof href === "string" ? href.trim() : ""
  if (!value) return "/collections/all"
  if (value.startsWith("/categories/")) return value.replace(/^\/categories\//, "/collections/")
  if (value.startsWith("/products/")) return value.replace(/^\/products\//, "/product/")
  if (!/^https?:\/\//i.test(value) && !value.startsWith("/")) return `/${value}`
  return value
}
