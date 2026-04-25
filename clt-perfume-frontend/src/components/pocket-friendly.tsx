"use client"

import { useState, useEffect } from "react"
import { ProductCard } from "@/components/product/product-card"
import { getSiteSettings, getProducts } from "@/lib/api"
import { Product } from "@/lib/products"

interface PocketFriendlyProps {
  initialPricePoints?: number[]
  initialProducts?: Product[]
}

export function PocketFriendly({ initialPricePoints, initialProducts }: PocketFriendlyProps) {
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null)
  const [pricePoints, setPricePoints] = useState<number[]>(initialPricePoints ?? [])
  const [allProducts, setAllProducts] = useState<Product[]>(initialProducts ?? [])

  useEffect(() => {
    if (initialPricePoints !== undefined && initialProducts !== undefined) return

    async function load() {
      const [settings, productsData] = await Promise.all([
        initialPricePoints === undefined ? getSiteSettings() : Promise.resolve(null),
        initialProducts === undefined ? getProducts() : Promise.resolve(initialProducts),
      ])

      if (initialPricePoints === undefined && settings?.pocket_friendly_configs) {
        setPricePoints(settings.pocket_friendly_configs)
      }

      if (initialProducts === undefined) {
        setAllProducts((productsData as Product[]) || [])
      }
    }
    load()
  }, [initialPricePoints, initialProducts])

  const filteredProducts = selectedPrice 
    ? allProducts.filter(p => Number(p.price) <= selectedPrice)
    : []

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="w-full bg-black p-8 md:p-12 lg:px-16 flex flex-col lg:flex-row items-center justify-between gap-8 h-auto lg:h-[220px]">
          {/* Left Text */}
          <div className="flex flex-col text-center lg:text-left shrink-0 pl-1 md:pl-10">
            <h2 className="text-[2.75rem] md:text-6xl font-black tracking-[0.2em] text-white leading-none mb-1">POCKET</h2>
            <p className="text-amber-500 text-sm md:text-[15px] tracking-[0.3em] uppercase font-bold mt-1 mb-4">Affordable Luxury</p>
            <div className="w-24 h-[2px] bg-amber-500 mx-auto lg:mx-0"></div>
          </div>


          {/* Cards */}
          <div className="flex flex-wrap justify-center lg:justify-end gap-4 md:gap-6 pb-4 lg:pb-0 w-full lg:w-auto items-center">
            {pricePoints.map((price: number) => (
              <button
                key={price}
                onClick={() => setSelectedPrice(selectedPrice === price ? null : price)}
                className={`shrink-0 w-[100px] h-[100px] md:w-[140px] md:h-[130px] bg-white rounded-[1.5rem] flex flex-col items-center justify-center transition-all ${selectedPrice === price ? 'ring-4 ring-neutral-400 scale-105 shadow-2xl' : 'hover:scale-105 shadow-sm'}`}
              >
                <span className="text-[10px] md:text-sm font-black uppercase tracking-wider text-black">Under</span>
                <span className="text-3xl md:text-[3.5rem] font-serif font-bold text-black my-1 md:my-2 leading-none">{price}</span>
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-black">AED</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filtered Products Dropdown */}
        {selectedPrice && (
          <div className="mt-12 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-between mb-8 border-b border-neutral-100 pb-4">
              <h3 className="text-2xl font-serif font-medium text-neutral-900">
                Fragrances Under {selectedPrice} AED
              </h3>
              <button onClick={() => setSelectedPrice(null)} className="text-sm font-medium text-neutral-500 hover:text-black transition-colors">
                Clear Filter
              </button>
            </div>
            
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-neutral-50 rounded-2xl border border-neutral-100">
                <p className="text-neutral-500 text-lg font-serif">No fragrances found under {selectedPrice} AED.</p>
                <button onClick={() => setSelectedPrice(null)} className="mt-4 text-sm font-semibold uppercase tracking-widest text-black hover:text-neutral-600">Explore Collection</button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
