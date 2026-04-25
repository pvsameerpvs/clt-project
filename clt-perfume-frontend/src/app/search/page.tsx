"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { getProducts } from "@/lib/api"
import { ProductCard } from "@/components/product/product-card"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"
import type { Product } from "@/lib/products"

function SearchContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q")
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!query) {
        setProducts([])
        setLoading(false)
        return
      }
      setLoading(true)
      const data = await getProducts({ search: query })
      setProducts(data || [])
      setLoading(false)
    }
    load()
  }, [query])

  return (
    <div className="min-h-screen bg-white pb-20 pt-12">
      <div className="container mx-auto px-4 md:px-6">
        <header className="mb-12">
          <Badge variant="outline" className="mb-4 tracking-widest uppercase">
            Search Results
          </Badge>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl md:text-5xl font-serif">
              {query ? `"${query}"` : "All Products"}
            </h1>
            <span className="text-neutral-400 font-light text-xl">
              ({products.length})
            </span>
          </div>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[4/5] bg-neutral-50 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 border-2 border-dashed rounded-3xl border-neutral-100">
            <Search className="h-12 w-12 text-neutral-200 mx-auto mb-4" />
            <h3 className="text-xl font-serif text-neutral-900 mb-2">No results found</h3>
            <p className="text-neutral-500 max-w-xs mx-auto font-light">
              We could not find any fragrances matching your search. Try different keywords or browse our collections.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <SearchContent />
    </Suspense>
  )
}
