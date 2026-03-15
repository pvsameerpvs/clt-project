"use client"

import React, { createContext, useContext, useState, useEffect, useRef } from "react"
import { Product } from "@/lib/products"

interface WishlistContextType {
  items: Product[]
  toggleWishlist: (product: Product) => void
  isInWishlist: (productId: string) => boolean
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Product[]>([])
  const hasLoadedFromStorage = useRef(false)

  // Load from LocalStorage after first mount to avoid SSR hydration mismatches.
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cle_wishlist")
      if (saved) {
        const parsed = JSON.parse(saved) as Product[]
        queueMicrotask(() => {
          setItems(parsed)
          hasLoadedFromStorage.current = true
        })
        return
      }
    } catch (e) {
      console.error("Failed to load wishlist", e)
    }

    hasLoadedFromStorage.current = true
  }, [])

  // Save to LocalStorage
  useEffect(() => {
    if (!hasLoadedFromStorage.current) return
    localStorage.setItem("cle_wishlist", JSON.stringify(items))
  }, [items])

  const toggleWishlist = (product: Product) => {
    setItems(prev => {
      const exists = prev.some(item => item.id === product.id)
      if (exists) {
        return prev.filter(item => item.id !== product.id)
      }
      return [...prev, product]
    })
  }

  const isInWishlist = (productId: string) => {
    return items.some(item => item.id === productId)
  }

  return (
    <WishlistContext.Provider value={{ items, toggleWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider")
  }
  return context
}
