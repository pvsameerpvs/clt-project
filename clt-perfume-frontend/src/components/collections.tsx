"use client"

import { useEffect, useState } from "react"
import { CollectionCard } from "@/components/collections/collection-card"
import { getSiteSettings } from "@/lib/api"

interface CuratedCollectionItem {
  href: string
  image: string
  cover_image?: string
  subtitle: string
  title: string
  action: string
  product_slugs?: string[]
}

function normalizeProductSlugs(input: unknown) {
  if (!Array.isArray(input)) return []
  const seen = new Set<string>()
  const values: string[] = []
  for (const token of input) {
    if (typeof token !== "string") continue
    const value = token.trim()
    if (!value || seen.has(value)) continue
    seen.add(value)
    values.push(value)
  }
  return values
}

function buildCollectionHref(collection: CuratedCollectionItem) {
  const existingHref = typeof collection.href === "string" ? collection.href.trim() : ""
  if (existingHref) return existingHref

  const productSlugs = normalizeProductSlugs(collection.product_slugs)
  if (productSlugs.length === 1) return `/product/${encodeURIComponent(productSlugs[0])}`
  if (productSlugs.length > 1) {
    return `/collections/all?products=${productSlugs.map((slug) => encodeURIComponent(slug)).join(",")}`
  }

  return "/collections/all"
}

export function Collections() {
  const [collections, setCollections] = useState<CuratedCollectionItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const settings = await getSiteSettings()
      if (settings?.collections) {
        setCollections(settings.collections)
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="py-24 animate-pulse"><div className="container mx-auto px-4 h-96 bg-neutral-50 rounded-[2rem]" /></div>

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col mb-12">
          <h2 className="text-3xl md:text-5xl font-serif font-medium tracking-tight text-neutral-900 mb-4">
            Curated Selections
          </h2>
          <p className="text-neutral-500 max-w-lg font-light">
            Discover our most sought-after fragrances, tailored for every preference and occasion. Shop by exclusive collections.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[400px] md:auto-rows-[600px]">
          {collections.map((col, idx) => (
            <CollectionCard 
              key={idx}
              href={buildCollectionHref(col)}
              imageSrc={col.image}
              imageAlt={col.subtitle}
              subtitle={col.subtitle}
              title={<span dangerouslySetInnerHTML={{ __html: col.title }} />}
              actionText={col.action}
            />
          ))}
        </div>

      </div>
    </section>
  )
}
