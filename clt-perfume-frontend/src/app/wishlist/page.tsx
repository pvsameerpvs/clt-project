"use client"

import Link from "next/link"
import { useWishlist } from "@/contexts/wishlist-context"
import { ProductCard } from "@/components/product/product-card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Heart } from "lucide-react"

export default function WishlistPage() {
  const { items } = useWishlist()

  if (items.length === 0) {
    return (
      <div className="min-h-[80vh] bg-white flex flex-col items-center justify-center px-6">
        <div className="relative mb-10">
          <div className="h-32 w-32 bg-neutral-50 rounded-full flex items-center justify-center animate-pulse">
            <Heart className="h-12 w-12 text-neutral-200" />
          </div>
          <div className="absolute -bottom-2 -right-2 h-12 w-12 bg-black rounded-full flex items-center justify-center text-white shadow-xl">
            <Heart className="h-5 w-5 fill-current" />
          </div>
        </div>
        
        <h1 className="text-4xl font-serif text-neutral-900 mb-4 tracking-tight">Your Wishlist is Waiting</h1>
        <p className="text-neutral-500 font-light mb-10 max-w-xs text-center leading-relaxed">
          Curate your collection of signature scents. Save the perfumes that speak to you for later.
        </p>
        
        <Link href="/">
          <Button className="h-14 px-12 rounded-full bg-black text-white hover:bg-neutral-800 uppercase tracking-[0.2em] text-[10px] font-bold transition-all shadow-lg hover:shadow-black/20">
            Start Exploring
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pb-24 pt-12">
      <div className="container mx-auto px-4 md:px-8">
        {/* Header Section */}
        <div className="mb-12">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-neutral-400 hover:text-black transition-colors mb-8 group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to Home
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-100 pb-8">
            <div>
              <h1 className="text-4xl md:text-6xl font-serif font-medium text-neutral-900 tracking-tight">My Wishlist</h1>
              <p className="text-neutral-500 font-light mt-2 text-sm tracking-wide">
                A curated selection of your favorite fragrances.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 px-4 rounded-full bg-neutral-50 border border-neutral-100 flex items-center justify-center text-xs font-medium text-neutral-600 uppercase tracking-widest">
                {items.length} {items.length === 1 ? 'Fragrance' : 'Fragrances'}
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-16">
          {items.map((product) => (
            <div key={product.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
