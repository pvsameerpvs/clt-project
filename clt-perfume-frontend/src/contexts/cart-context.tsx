"use client"

import React, { createContext, useCallback, useContext, useState, useEffect, useRef } from "react"
import { Product } from "@/lib/products"
import { syncCartToDatabase, clearCartFromDatabase } from "@/lib/cart-api"

export interface CartBundleMeta {
  id: string
  name: string
  size: number
  discountPercent: number
}

export interface AddToCartOptions {
  bundle?: CartBundleMeta
  originalUnitPrice?: number
  parentId?: string
  isGift?: boolean
  replace?: boolean
}

export interface CartItem {
  product: Product
  quantity: number
  bundle?: CartBundleMeta
  originalUnitPrice?: number
  parentId?: string
  isGift?: boolean
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

import { useAuth } from "./auth-context"

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, accessToken } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [promo, setPromo] = useState<AppliedPromo | null>(null)
  const hasLoadedFromStorage = useRef(false)
  const prevUserRef = useRef<string | null>(null)
  const cartSyncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Detect Logout - if we had a user and now we don't, clear the cart.
  useEffect(() => {
    const currentUserId = user?.id || null
    if (prevUserRef.current && !currentUserId) {
      queueMicrotask(() => {
        // Transition from logged-in to guest (Logout)
        setItems([])
        setPromo(null)
        localStorage.removeItem("cle_cart")
        localStorage.removeItem("cle_cart_promo")
      })
    }
    prevUserRef.current = currentUserId
  }, [user])

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
          } else if (
            parsedPromo &&
            parsedPromo.code &&
            parsedPromo.discountType &&
            String(parsedPromo.code).toUpperCase() !== "SIGNIN10"
          ) {
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

  // Save to LocalStorage and debounce syncs so rapid cart changes don't spam auth-dependent requests.
  useEffect(() => {
    if (!hasLoadedFromStorage.current) return

    localStorage.setItem("cle_cart", JSON.stringify(items))

    if (cartSyncTimeoutRef.current) {
      clearTimeout(cartSyncTimeoutRef.current)
    }

    cartSyncTimeoutRef.current = setTimeout(() => {
      if (items.length > 0) {
        const totalPrice = items.reduce((acc, item) => acc + (item.product.price * item.quantity), 0)
        void syncCartToDatabase(accessToken, items, totalPrice)
        return
      }

      void clearCartFromDatabase(accessToken)
    }, 400)

    return () => {
      if (cartSyncTimeoutRef.current) {
        clearTimeout(cartSyncTimeoutRef.current)
        cartSyncTimeoutRef.current = null
      }
    }
  }, [accessToken, items])

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
      // 1. If adding a gift, remove any existing gift for the same parent first (Anti-Abuse)
      let filtered = prev;
      if (options?.isGift && options.parentId) {
        filtered = prev.filter(item => !(item.isGift && item.parentId === options.parentId))
      }

      const targetLineKey = getCartLineKey(
        product.id, 
        toPriceNumber(product.price), 
        options?.bundle?.id || (options?.isGift ? `gift-${options.parentId}` : undefined)
      )
      
      const existing = filtered.find(item => {
        const itemKey = getCartLineKey(
          item.product.id, 
          toPriceNumber(item.product.price), 
          item.bundle?.id || (item.isGift ? `gift-${item.parentId}` : undefined)
        )
        return itemKey === targetLineKey
      })

      if (existing) {
        return filtered.map(item => {
          const itemKey = getCartLineKey(
            item.product.id, 
            toPriceNumber(item.product.price), 
            item.bundle?.id || (item.isGift ? `gift-${item.parentId}` : undefined)
          )
          if (itemKey === targetLineKey) {
            return { 
              ...item, 
              quantity: options?.replace ? quantity : item.quantity + quantity 
            }
          }
          return item
        })
      }

      return [
        ...filtered,
        {
          product,
          quantity,
          bundle: options?.bundle,
          parentId: options?.parentId,
          isGift: options?.isGift,
          originalUnitPrice:
            options?.originalUnitPrice === undefined ? undefined : toPriceNumber(options.originalUnitPrice),
        },
      ]
    })
  }

  const removeFromCart = (lineKey: string) => {
    setItems(prev => {
      // Find the item being removed
      const itemToRemove = prev.find(item => {
        const itemKey = getCartLineKey(
          item.product.id, 
          toPriceNumber(item.product.price), 
          item.bundle?.id || (item.isGift ? `gift-${item.parentId}` : undefined)
        )
        return itemKey === lineKey
      })

      if (!itemToRemove) return prev

      // Filter out the item and, if it's a parent, filter out its children (Linked Removal)
      const next = prev.filter(item => {
        const itemKey = getCartLineKey(
          item.product.id, 
          toPriceNumber(item.product.price), 
          item.bundle?.id || (item.isGift ? `gift-${item.parentId}` : undefined)
        )
        const isTarget = itemKey === lineKey
        const isChildOfTarget = item.parentId === itemToRemove.product.id
        
        return !isTarget && !isChildOfTarget
      })

      if (next.length === 0) setPromo(null)
      return next
    })
  }

  const updateQuantity = (lineKey: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(lineKey)
      return
    }
    setItems(prev => prev.map(item => {
      const itemKey = getCartLineKey(
        item.product.id, 
        toPriceNumber(item.product.price), 
        item.bundle?.id || (item.isGift ? `gift-${item.parentId}` : undefined)
      )
      return itemKey === lineKey ? { ...item, quantity } : item
    }))
  }

  const clearCart = useCallback(async () => {
    setItems([])
    setPromo(null)
    
    // Clear the tracking on the backend so they don't get an abandoned cart email after buying
    await clearCartFromDatabase(accessToken)
  }, [accessToken])

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
