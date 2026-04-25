"use client"

import Image from "next/image"
import Link from "next/link"
import { Plus, Minus, X } from "lucide-react"
import { CartItem as CartLineItem, getCartLineKey, useCart } from "@/contexts/cart-context"
import { getCategoryLabel } from "@/lib/products"

export function CartItem({ item }: { item: CartLineItem }) {
  const { updateQuantity, removeFromCart } = useCart()
  const lineKey = getCartLineKey(item.product.id, Number(item.product.price), item.bundle?.id)
  const categoryLabel = getCategoryLabel(item.product.category)

  return (
    <div className="flex gap-4 py-6 border-b border-neutral-100 last:border-0 relative">
      <div className="relative h-24 w-20 bg-neutral-50 rounded-xl overflow-hidden flex-shrink-0">
        <Image 
          src={item.product.images[0]} 
          alt={item.product.name} 
          fill 
          className="object-cover" 
        />
      </div>
      
      <div className="flex-grow flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="pr-8">
            <h3 className="font-serif text-base md:text-lg text-neutral-900 leading-tight">
              <Link href={`/product/${item.product.slug}`} className="hover:text-neutral-600 transition-colors">
                {item.product.name}
              </Link>
            </h3>
            <p className="text-[10px] uppercase tracking-widest text-neutral-400 mt-1">
              {categoryLabel}
              {item.product.ml && (
                <>
                  <span className="mx-1.5 opacity-50">•</span>
                  {item.product.ml}ML
                </>
              )}
            </p>
          </div>
          <button 
            onClick={() => removeFromCart(lineKey)}
            className="text-neutral-300 hover:text-black transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center border border-neutral-200 rounded-full h-8 px-1">
            <button 
              onClick={() => updateQuantity(lineKey, item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="w-8 flex items-center justify-center hover:bg-neutral-50 rounded-full transition-colors disabled:opacity-30"
            >
              <Minus className="h-2.5 w-2.5" />
            </button>
            <span className="w-6 text-center text-xs font-medium">{item.quantity}</span>
            <button 
              onClick={() => updateQuantity(lineKey, item.quantity + 1)}
              className="w-8 flex items-center justify-center hover:bg-neutral-50 rounded-full transition-colors"
            >
              <Plus className="h-2.5 w-2.5" />
            </button>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-neutral-500 block leading-none font-medium">AED</span>
            <span className="font-semibold text-sm md:text-base text-black">{(item.product.price * item.quantity).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
