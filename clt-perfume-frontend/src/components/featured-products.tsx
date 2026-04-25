"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/product/product-card"
import { getProducts } from "@/lib/api"
import Link from "next/link"
import { Product } from "@/lib/products"

interface FeaturedProductsProps {
  initialProducts?: Product[]
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

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-5xl font-serif font-medium tracking-tight text-neutral-900">
              The Collection
            </h2>
            <p className="text-neutral-500 max-w-sm font-light">
              Carefully curated scents designed to evoke emotion and memory.
            </p>
          </div>
          <Link href="/collections/all">
            <Button variant="link" className="text-black underline-offset-4 hover:text-neutral-600 px-0">
              View All Scents
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
          {products.length > 0 ? (
            products.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-neutral-100 rounded-3xl">
              <p className="text-neutral-400 font-light italic">Your fragrance collection is currently being curated. Check back soon!</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
