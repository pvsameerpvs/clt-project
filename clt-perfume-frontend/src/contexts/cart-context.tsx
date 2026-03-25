"use client"

import React, { createContext, useContext, useState, useEffect, useRef } from "react"
import { Product } from "@/lib/products"

export interface CartBundleMeta {
  id: string
  name: string
  size: number
  discountPercent: number
}

export interface AddToCartOptions {
  bundle?: CartBundleMeta
  originalUnitPrice?: number
}

export interface CartItem {
  product: Product
  quantity: number
  bundle?: CartBundleMeta
  originalUnitPrice?: number
}

export type PromoDiscountType = "percentage" | "fixed"

export interface AppliedPromo {
  code: string
  discountType: PromoDiscountType
  discountValue: number
}

function toPriceNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function calculatePromoDiscount(subtotal: number, promo: AppliedPromo | null) {
  const safeSubtotal = Math.max(0, toPriceNumber(subtotal))
  if (!promo) return 0

  const safeValue = Math.max(0, toPriceNumber(promo.discountValue))
  if (promo.discountType === "fixed") return Math.min(safeSubtotal, safeValue)

  const percent = Math.min(100, safeValue)
  return (safeSubtotal * percent) / 100
}

export function getCartLineKey(productId: string, unitPrice: number, bundleId?: string) {
  const scope = bundleId?.trim() || "single"
  return `${scope}::${productId}::${Math.round(toPriceNumber(unitPrice) * 100)}`
}

function getItemLineKey(item: CartItem) {
  return getCartLineKey(item.product.id, toPriceNumber(item.product.price), item.bundle?.id)
}

interface CartContextType {
  items: CartItem[]
  addToCart: (product: Product, quantity: number, options?: AddToCartOptions) => void
  removeFromCart: (lineKey: string) => void
  updateQuantity: (lineKey: string, quantity: number) => void
  clearCart: () => void
  promo: AppliedPromo | null
  setPromo: (promo: AppliedPromo | null) => void
  promoDiscountAmount: number
  discountedTotal: number
  totalItems: number
  totalPrice: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [promo, setPromo] = useState<AppliedPromo | null>(null)
  const hasLoadedFromStorage = useRef(false)

  // Load from LocalStorage after first mount to avoid SSR hydration mismatches.
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cle_cart")
      if (saved) {
        const parsed = JSON.parse(saved) as CartItem[]
        const savedPromo = localStorage.getItem("cle_cart_promo")
        const parsedPromo = savedPromo ? (JSON.parse(savedPromo) as AppliedPromo) : null
        queueMicrotask(() => {
          setItems(parsed)
          if (parsed.length === 0) {
            setPromo(null)
          } else if (parsedPromo && parsedPromo.code && parsedPromo.discountType) {
            setPromo({
              code: String(parsedPromo.code).toUpperCase(),
              discountType: parsedPromo.discountType === "fixed" ? "fixed" : "percentage",
              discountValue: Math.max(0, toPriceNumber(parsedPromo.discountValue)),
            })
          } else {
            setPromo(null)
          }
          hasLoadedFromStorage.current = true
        })
        return
      }
    } catch (e) {
      console.error("Failed to load cart", e)
    }

    hasLoadedFromStorage.current = true
  }, [])

  // Save to LocalStorage
  useEffect(() => {
    if (!hasLoadedFromStorage.current) return
    localStorage.setItem("cle_cart", JSON.stringify(items))
  }, [items])

  useEffect(() => {
    if (!hasLoadedFromStorage.current) return
    if (promo) {
      localStorage.setItem("cle_cart_promo", JSON.stringify(promo))
      return
    }
    localStorage.removeItem("cle_cart_promo")
  }, [promo])

  const addToCart = (product: Product, quantity: number, options?: AddToCartOptions) => {
    setItems(prev => {
      const targetLineKey = getCartLineKey(product.id, toPriceNumber(product.price), options?.bundle?.id)
      const existing = prev.find(item => getItemLineKey(item) === targetLineKey)
      if (existing) {
        return prev.map(item => 
          getItemLineKey(item) === targetLineKey
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }
      return [
        ...prev,
        {
          product,
          quantity,
          bundle: options?.bundle,
          originalUnitPrice:
            options?.originalUnitPrice === undefined ? undefined : toPriceNumber(options.originalUnitPrice),
        },
      ]
    })
  }

  const removeFromCart = (lineKey: string) => {
    setItems(prev => {
      const next = prev.filter(item => getItemLineKey(item) !== lineKey)
      if (next.length === 0) setPromo(null)
      return next
    })
  }

  const updateQuantity = (lineKey: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(lineKey)
      return
    }
    setItems(prev => prev.map(item => 
      getItemLineKey(item) === lineKey ? { ...item, quantity } : item
    ))
  }

  const clearCart = () => {
    setItems([])
    setPromo(null)
  }

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0)
  const totalPrice = items.reduce((acc, item) => acc + (item.product.price * item.quantity), 0)
  const promoDiscountAmount = calculatePromoDiscount(totalPrice, promo)
  const discountedTotal = Math.max(0, totalPrice - promoDiscountAmount)

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        promo,
        setPromo,
        promoDiscountAmount,
        discountedTotal,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
