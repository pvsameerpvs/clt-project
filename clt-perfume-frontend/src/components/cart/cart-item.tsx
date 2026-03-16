"use client"

import Image from "next/image"
import Link from "next/link"
import { Plus, Minus, X } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { Product, getCategoryLabel } from "@/lib/products"

interface CartLineItem {
  product: Product
  quantity: number
}

export function CartItem({ item }: { item: CartLineItem }) {
  const { updateQuantity, removeFromCart } = useCart()
  const categoryLabel = getCategoryLabel(item.product.category)

  return (
    <div className="flex gap-6 py-6 border-b border-neutral-100 last:border-0 relative">
      <div className="relative h-32 w-24 bg-neutral-50 rounded-sm overflow-hidden flex-shrink-0">
        <Image 
          src={item.product.images[0]} 
          alt={item.product.name} 
          fill 
          className="object-cover" 
        />
      </div>
      
      <div className="flex-grow flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-serif text-lg text-neutral-900 leading-tight">
              <Link href={`/product/${item.product.slug}`} className="hover:text-neutral-600 transition-colors">
                {item.product.name}
              </Link>
            </h3>
            <p className="text-xs uppercase tracking-widest text-neutral-500 mt-1">{categoryLabel}</p>
          </div>
          <button 
            onClick={() => removeFromCart(item.product.id)}
            className="text-neutral-400 hover:text-black transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex justify-between items-end mt-4">
          <div className="flex items-center border border-neutral-200 rounded-full">
            <button 
              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
              className="h-8 w-8 flex items-center justify-center hover:bg-neutral-50 rounded-l-full transition-colors"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-8 text-center text-xs font-medium">{item.quantity}</span>
            <button 
              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
              className="h-8 w-8 flex items-center justify-center hover:bg-neutral-50 rounded-r-full transition-colors"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <span className="font-medium text-black">AED {item.product.price * item.quantity}</span>
        </div>
      </div>
    </div>
  )
}
