"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { Product } from "@/lib/products"
import { useWishlist } from "@/contexts/wishlist-context"
import { toast } from "sonner"

export function ProductGallery({ product }: { product: Product }) {
  const { toggleWishlist, isInWishlist } = useWishlist()
  const validImages = useMemo(
    () => (product.images || []).filter((img) => typeof img === "string" && img.trim().length > 0),
    [product.images]
  )
  const [activeImage, setActiveImage] = useState<string | null>(() => validImages[0] || null)
  const [isZoomed, setIsZoomed] = useState(false)
  const displayImage =
    activeImage && validImages.includes(activeImage) ? activeImage : (validImages[0] || null)

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
        onMouseEnter={() => {
          if (displayImage) setIsZoomed(true)
        }}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
        style={{
          backgroundImage: isZoomed && displayImage ? `url(${displayImage})` : "none",
          backgroundSize: '200%',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {displayImage ? (
          <Image
            src={displayImage}
            alt={product.name}
            fill
            className={`object-cover transition-opacity duration-300 ${isZoomed ? 'opacity-0' : 'opacity-100'}`}
            priority
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-sm text-neutral-400">
            Image unavailable
          </div>
        )}
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

      {validImages.length > 0 && (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {validImages.map((img, idx) => (
            <button
              key={`${img}-${idx}`}
              onClick={() => setActiveImage(img)}
              className={`relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                displayImage === img ? 'border-black' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <Image src={img} alt={`Thumbnail ${idx + 1}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
