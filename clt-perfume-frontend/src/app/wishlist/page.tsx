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
      <div className="min-h-[70vh] bg-white flex flex-col items-center justify-center px-4">
        <div className="h-24 w-24 bg-neutral-50 rounded-full flex items-center justify-center mb-6">
          <Heart className="h-10 w-10 text-neutral-300" />
        </div>
        <h1 className="text-3xl font-serif text-neutral-900 mb-4">Your Wishlist is Empty</h1>
        <p className="text-neutral-500 font-light mb-8 max-w-sm text-center">
          Tap the heart icon on any product to save it to your curated wishlist.
        </p>
        <Link href="/">
          <Button className="h-14 px-8 rounded-none bg-black text-white hover:bg-neutral-800 uppercase tracking-widest text-xs font-medium transition-all">
            Discover Perfumes
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center gap-4 mb-10 border-b border-neutral-100 pb-8">
          <Link href="/" className="h-10 w-10 bg-neutral-50 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors">
            <ArrowLeft className="h-4 w-4 text-neutral-600" />
          </Link>
          <h1 className="text-4xl font-serif text-neutral-900">Your Wishlist</h1>
          <span className="text-sm text-neutral-500 font-light mt-2 ml-2">
            ({items.length} {items.length === 1 ? 'item' : 'items'})
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  )
}
