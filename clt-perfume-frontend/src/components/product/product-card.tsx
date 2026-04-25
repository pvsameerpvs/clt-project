"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Heart } from "lucide-react"
import Link from "next/link"
import { Product } from "@/lib/products"
import { useCart } from "@/contexts/cart-context"
import { useWishlist } from "@/contexts/wishlist-context"
import { toast } from "sonner"

interface ProductBadgeConfig {
  key: "new" | "exclusive" | "best-seller"
  label: string
  className: string
}

function getProductBadges(product: Product): ProductBadgeConfig[] {
  const badges: ProductBadgeConfig[] = []

  if (product.isNew || product.is_new) {
    badges.push({
      key: "new",
      label: "New Arrival",
      className: "bg-white text-black border-neutral-200",
    })
  }

  if (product.isExclusive || product.is_exclusive) {
    badges.push({
      key: "exclusive",
      label: "Exclusive",
      className: "bg-black text-white border-black",
    })
  }

  if (product.isBestSeller || product.is_best_seller) {
    badges.push({
      key: "best-seller",
      label: "Best Seller",
      className: "bg-amber-500 text-white border-amber-500",
    })
  }

  return badges
}

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()
  const badges = getProductBadges(product)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    addToCart(product, 1)
    toast.success(`${product.name} added to bag`, {
      description: "You can view your bag or continue shopping.",
      action: {
        label: "View Bag",
        onClick: () => window.location.href = '/cart'
      },
    })
  }

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    toggleWishlist(product)
    
    if (isInWishlist(product.id)) {
      toast(`${product.name} removed from wishlist`)
    } else {
      toast.success(`${product.name} added to wishlist`)
    }
  }

  return (
    <Link href={`/product/${product.slug}`} className="block group">
      <Card className="border-none shadow-none bg-transparent rounded-none overflow-visible h-full">
        <CardContent className="p-0 relative aspect-[4/5] bg-neutral-50 overflow-hidden mb-4 rounded-xl shadow-sm">
          {/* Primary Image */}
          <div className="absolute inset-0 transition-opacity duration-500 z-10 group-hover:opacity-0">
            <Image
              src={product.images?.[0] || "/placeholder-perfume.png"}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
          
          {/* Secondary Image (Hover) */}
          <div className="absolute inset-0 transition-opacity duration-500 z-0">
             <Image
              src={product.images?.[1] || product.images?.[0] || "/placeholder-perfume.png"}
              alt={`${product.name} alternate view`}
              fill
              className="object-cover"
            />
          </div>
          
            <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-20 flex flex-col items-start gap-1 sm:gap-2">
               {badges.map((badge) => (
                 <span
                   key={badge.key}
                   className={`rounded-md border px-1.5 py-0.5 sm:px-3 sm:py-1 text-[7px] sm:text-[9px] font-bold uppercase tracking-[0.14em] shadow-sm ${badge.className}`}
                 >
                   {badge.label}
                 </span>
               ))}
            </div>



          <div className="absolute top-4 right-4 z-20 transition-opacity duration-300">
             <Button 
                onClick={handleWishlist}
                size="icon" 
                variant="ghost" 
                className={`h-8 w-8 rounded-full shadow-sm hover:scale-110 transition-transform ${isInWishlist(product.id) ? 'bg-white text-red-500 opacity-100 hover:text-red-600 hover:bg-white' : 'bg-white/90 text-neutral-800 hover:bg-white opacity-0 group-hover:opacity-100'}`}
             >
               <Heart className={`h-4 w-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
             </Button>
          </div>

          <div className="absolute inset-x-0 bottom-0 z-20 hidden p-4 translate-y-full transition-transform duration-300 ease-out bg-gradient-to-t from-black/60 to-transparent md:block md:group-hover:translate-y-0">
             <Button 
                onClick={handleAddToCart}
                className="w-full bg-white text-black hover:bg-neutral-100 backdrop-blur-sm shadow-lg rounded-full h-11 text-xs uppercase tracking-widest font-medium group-hover:delay-75 transition-all"
             >
               Add to Bag 
               {/* — AED {product.price} */}
             </Button>
          </div>
        </CardContent>
        
        <CardFooter className="p-0 flex flex-col items-start gap-1">
          <div className="flex justify-between w-full items-start gap-2 min-h-[50px] sm:min-h-[70px]">
              <div className="min-w-0 flex-1">
                <h3 className="font-serif text-xs sm:text-lg text-neutral-900 leading-tight group-hover:text-neutral-600 transition-colors uppercase sm:normal-case truncate">
                  {product.name}
                </h3>
                <div className="text-[8px] sm:text-xs text-neutral-500 mt-0.5 sm:mt-1 uppercase tracking-wider flex flex-col gap-0.5 overflow-hidden w-full">
                   <p className="truncate">{product.scent}</p>
                   <p className="font-medium text-neutral-400">{product.ml || "100"} ML</p>
                </div>
             </div>
             <div className="flex flex-col sm:flex-row items-end sm:items-start text-right shrink-0">
                <span className="font-medium text-[11px] sm:text-sm text-neutral-900">AED {product.price}</span>
             </div>
          </div>
          <Button
            onClick={handleAddToCart}
            className="mt-2 h-9 w-full rounded-full bg-black text-[10px] font-medium uppercase tracking-widest text-white transition-all hover:bg-neutral-800 md:hidden"
          >
            Add to Bag
          </Button>
        </CardFooter>
      </Card>
    </Link>
  )
}
