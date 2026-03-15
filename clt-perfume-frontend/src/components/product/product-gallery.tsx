"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { Product } from "@/lib/products"
import { useWishlist } from "@/contexts/wishlist-context"
import { toast } from "sonner"

export function ProductGallery({ product }: { product: Product }) {
  const { toggleWishlist, isInWishlist } = useWishlist()
  const [activeImage, setActiveImage] = useState(product.images[0])
  const [isZoomed, setIsZoomed] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - left) / width) * 100
    const y = ((e.clientY - top) / height) * 100
    e.currentTarget.style.backgroundPosition = `${x}% ${y}%`
  }

  return (
    <div className="space-y-6">
      <div 
        className="relative aspect-square w-full rounded-2xl overflow-hidden bg-neutral-50 cursor-zoom-in group"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
        style={{
          backgroundImage: isZoomed ? `url(${activeImage})` : 'none',
          backgroundSize: '200%',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <Image
          src={activeImage}
          alt={product.name}
          fill
          className={`object-cover transition-opacity duration-300 ${isZoomed ? 'opacity-0' : 'opacity-100'}`}
          priority
        />
        <div className="absolute top-4 right-4 z-10">
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                toggleWishlist(product);
                if (isInWishlist(product.id)) {
                  toast(`${product.name} removed from wishlist`)
                } else {
                  toast.success(`${product.name} added to wishlist`)
                }
              }}
              size="icon" 
              variant="ghost" 
              className={`rounded-full shadow-sm backdrop-blur-sm transition-transform hover:scale-110 ${
                isInWishlist(product.id) ? 'bg-white text-red-500 hover:text-red-600 hover:bg-white' : 'bg-white/80 hover:bg-white text-neutral-800'
              }`}
            >
              <Heart className={`h-5 w-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
            </Button>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {product.images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setActiveImage(img)}
            className={`relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
              activeImage === img ? 'border-black' : 'border-transparent opacity-70 hover:opacity-100'
            }`}
          >
            <Image src={img} alt={`Thumbnail ${idx + 1}`} fill className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}
