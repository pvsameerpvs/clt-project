"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getSiteSettings } from "@/lib/api"
import { isOfferActive } from "@/lib/offers"

interface PromoOffer {
  title: string
  description: string
  action: string
  href: string
  badge?: string
  bgColor?: string
  is_active?: boolean
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

function resolveOfferHref(offer: PromoOffer) {
  const href = typeof offer.href === "string" ? offer.href.trim() : ""
  if (/^\/offers\/[^/?#]+/i.test(href)) return href
  const fallbackSlug = slugify(offer.title)
  return fallbackSlug ? `/offers/${fallbackSlug}` : "/offers"
}

interface OfferCardsProps {
  initialOffers?: PromoOffer[]
}

export function OfferCards({ initialOffers }: OfferCardsProps) {
  const [offers, setOffers] = useState<PromoOffer[]>(initialOffers ? initialOffers.filter(isOfferActive) : [])

  useEffect(() => {
    if (initialOffers !== undefined) return

    async function load() {
      const settings = await getSiteSettings()
      if (settings?.offers) {
        setOffers(settings.offers.filter(isOfferActive))
      }
    }
    load()
  }, [initialOffers])

  const bgColors = ["bg-[#F3F0EA]", "bg-[#EBEFF5]", "bg-[#F5EBEB]"]

  if (offers.length === 0) return null

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {offers.map((card, idx) => (
            <Link 
              key={idx}
              href={resolveOfferHref(card)}
              className={`${bgColors[idx % 3]} p-10 lg:p-14 h-full flex flex-col justify-between group block hover:shadow-xl transition-all duration-500 border border-black/5`}
            >
              <div>
                <h3 className="text-2xl font-serif mb-4 text-neutral-900">{card.title}</h3>
                <p className="text-neutral-600 font-light mb-16 text-sm leading-relaxed max-w-[250px]">
                  {card.description}
                </p>
              </div>
              <div 
                className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-black group-hover:gap-4 transition-all"
              >
                {card.action} <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
