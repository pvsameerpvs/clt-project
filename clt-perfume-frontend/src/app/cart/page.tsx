"use client"

import Link from "next/link"
import { useCart } from "@/contexts/cart-context"
import { CartItem } from "@/components/cart/cart-item"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ShoppingBag } from "lucide-react"

export default function CartPage() {
  const { items, totalPrice, totalItems } = useCart()

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] bg-white flex flex-col items-center justify-center px-4">
        <div className="h-24 w-24 bg-neutral-100 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="h-10 w-10 text-neutral-300" />
        </div>
        <h1 className="text-3xl font-serif text-neutral-900 mb-4">Your Bag is Empty</h1>
        <p className="text-neutral-500 font-light mb-8 max-w-sm text-center">
          Discover our exclusive collections and find the perfect signature scent.
        </p>
        <Link href="/">
          <Button className="h-14 px-8 rounded-none bg-black text-white hover:bg-neutral-800 uppercase tracking-widest text-xs font-medium transition-all">
            Continue Shopping
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-16">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="flex items-center gap-4 mb-10">
          <Link href="/" className="h-10 w-10 bg-white shadow-sm flex items-center justify-center rounded-full hover:bg-neutral-50 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-4xl font-serif text-neutral-900">Your Shopping Bag</h1>
          <span className="text-sm text-neutral-500 font-light mt-2 ml-2">
            ({totalItems} {totalItems === 1 ? 'item' : 'items'})
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2 bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-neutral-100 h-fit">
            <div className="space-y-2">
              {items.map(item => (
                <CartItem key={item.product.id} item={item} />
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-100 sticky top-24">
              <h2 className="text-xl font-serif mb-6 border-b border-neutral-100 pb-4">Order Summary</h2>
              
              <div className="space-y-4 text-sm font-light text-neutral-600 mb-6">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-black">AED {totalPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-green-600 font-medium tracking-wide">FREE</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>

              <div className="flex justify-between items-end border-t border-neutral-100 pt-6 mb-8 text-neutral-900">
                <span className="font-serif">Total</span>
                <span className="text-2xl font-serif">AED {totalPrice}</span>
              </div>

              <Button className="w-full h-14 rounded-xl bg-black text-white hover:bg-neutral-800 uppercase tracking-widest text-xs font-medium transition-all shadow-lg shadow-black/10">
                Proceed to Checkout
              </Button>

              <div className="mt-6 flex items-center justify-center gap-4 text-neutral-400">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 11V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V11M5 9H19L21 21H3L5 9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-[10px] uppercase tracking-widest font-medium">Secure Checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
