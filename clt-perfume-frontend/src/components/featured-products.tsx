"use client"

import { useEffect, useState } from "react"
import { ProductCard } from "@/components/product/product-card"
import { getProducts } from "@/lib/api"
import Link from "next/link"
import { Product, getCategoryLabel, getCategorySlug } from "@/lib/products"
import { compareCategoryDisplayOrder, formatCategoryHeading, normalizeCategoryToken } from "@/lib/category-order"

interface FeaturedProductsProps {
  initialProducts?: Product[]
}

function buildCategorySections(products: Product[]) {
  const sections = new Map<string, { title: string; slug: string; href: string; products: Product[] }>()

  for (const product of products) {
    const label = getCategoryLabel(product.category)
    const slug = getCategorySlug(product.category) || normalizeCategoryToken(label)

    if (!slug || label === "Uncategorized") continue

    const key = normalizeCategoryToken(slug)
    const existing = sections.get(key)

    if (existing) {
      existing.products.push(product)
      continue
    }

    sections.set(key, {
      title: formatCategoryHeading(label, slug),
      slug,
      href: `/collections/${slug}`,
      products: [product],
    })
  }

  return Array.from(sections.values())
    .sort((a, b) => compareCategoryDisplayOrder({ name: a.title, slug: a.slug }, { name: b.title, slug: b.slug }))
    .map((section) => ({
      ...section,
      products: section.products.slice(0, 5),
    }))
}

export function FeaturedProducts({ initialProducts }: FeaturedProductsProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts ?? [])
  const [loading, setLoading] = useState(initialProducts === undefined)

  useEffect(() => {
    if (initialProducts !== undefined) return

    async function load() {
      const data = await getProducts()
      setProducts(data || [])
      setLoading(false)
    }
    load()
  }, [initialProducts])

  if (loading) return (
    <div className="py-24 container mx-auto px-4 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
      {[1,2,3,4].map(i => <div key={i} className="aspect-[4/5] bg-neutral-50 animate-pulse rounded-lg" />)}
    </div>
  )

  const categorySections = buildCategorySections(products)

  return (
    <section className="py-16 bg-white sm:py-20">
      <div className="container mx-auto px-4 md:px-6">
        {categorySections.length > 0 ? (
          <div className="space-y-14">
            {categorySections.map((section) => (
              <div key={section.title}>
                <div className="mb-5 flex items-center justify-between gap-4">
                  <h2 className="text-xl font-bold text-neutral-950 sm:text-2xl">
                    {section.title}
                  </h2>
                  <Link
                    href={section.href}
                    className="shrink-0 text-sm font-semibold text-neutral-700 underline underline-offset-2 transition-colors hover:text-black"
                  >
                    Show All
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {section.products.map((product) => (
                    <ProductCard key={`${section.title}-${product.id}`} product={product} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center border-2 border-dashed border-neutral-100 rounded-3xl">
            <p className="text-neutral-400 font-light italic">Your fragrance collection is currently being curated. Check back soon!</p>
          </div>
        )}
      </div>
    </section>
  )
}
