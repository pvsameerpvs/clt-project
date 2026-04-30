"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { AdminProduct } from "@/lib/admin-api"
import { getAdminProducts, updateAdminProduct } from "@/lib/admin-api"
import { StockSummary } from "@/components/stocks/stock-summary"
import { StockTable } from "@/components/stocks/stock-table"
import { StockToolbar } from "@/components/stocks/stock-toolbar"
import {
  getProductCategoryName,
  getProductSku,
  getStockStatus,
  getUniqueSizes,
  type StockFilter,
} from "@/components/stocks/stock-utils"

function productMatchesSearch(product: AdminProduct, query: string) {
  const text = query.trim().toLowerCase()
  if (!text) return true

  return [
    product.name,
    product.slug,
    product.scent,
    product.ml,
    product.variant_group_id,
    getProductCategoryName(product),
    getProductSku(product),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(text)
}

export default function StocksPage() {
  const router = useRouter()
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [stockFilter, setStockFilter] = useState<StockFilter>("all")
  const [sizeFilter, setSizeFilter] = useState("")
  const [updatingProductId, setUpdatingProductId] = useState<string | null>(null)

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const nextProducts = await getAdminProducts()
      setProducts(nextProducts)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load stock inventory.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProducts()
  }, [loadProducts])

  // Navigate to dedicated product detail page on row click
  function handleProductOpen(product: AdminProduct) {
    router.push(`/dashboard/stocks/${product.id}`)
  }

  async function handleStockChange(product: AdminProduct, nextStock: number) {
    try {
      setUpdatingProductId(product.id)
      setError(null)
      const updatedProduct = await updateAdminProduct(product.id, { stock: nextStock })
      setProducts((current) =>
        current.map((p) =>
          p.id === product.id
            ? { ...p, stock: Number(updatedProduct.stock ?? nextStock) }
            : p
        )
      )
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update stock.")
    } finally {
      setUpdatingProductId(null)
    }
  }

  const sizes = useMemo(() => getUniqueSizes(products), [products])

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => (sizeFilter ? p.ml === sizeFilter : true))
      .filter((p) => (stockFilter === "all" ? true : getStockStatus(p) === stockFilter))
      .filter((p) => productMatchesSearch(p, query))
      .sort((a, b) => {
        const statusOrder = { out: 0, low: 1, ready: 2, inactive: 3 }
        const diff = statusOrder[getStockStatus(a)] - statusOrder[getStockStatus(b)]
        if (diff !== 0) return diff
        return String(a.name || "").localeCompare(String(b.name || ""))
      })
  }, [products, query, sizeFilter, stockFilter])

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      {/* Page header */}
      <header>
        <div className="mb-2 flex items-center gap-3">
          <div className="h-[2px] w-8 bg-black" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">
            Inventory Control
          </span>
        </div>
        <h1 className="font-serif text-4xl italic tracking-tight text-neutral-900 md:text-5xl">
          Stocks
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Monitor inventory levels. Click any product row to view full details and order history.
        </p>
      </header>

      {/* Error banner */}
      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* Summary cards */}
      <StockSummary products={products} />

      {/* Toolbar */}
      <StockToolbar
        query={query}
        onQueryChange={setQuery}
        stockFilter={stockFilter}
        onStockFilterChange={setStockFilter}
        sizeFilter={sizeFilter}
        onSizeFilterChange={setSizeFilter}
        sizes={sizes}
        resultCount={filteredProducts.length}
        loading={loading}
        onRefresh={loadProducts}
      />

      {/* Table — full width, no side panel */}
      <StockTable
        products={filteredProducts}
        loading={loading}
        selectedProductId={null}
        updatingProductId={updatingProductId}
        onProductOpen={handleProductOpen}
        onStockChange={handleStockChange}
      />
    </div>
  )
}
