"use client"

import type { AdminProduct } from "@/lib/admin-api"
import { cn } from "@/lib/utils"
import {
  formatMoney,
  getProductCategoryName,
  getProductImage,
  getProductSku,
  getStockQuantity,
  getStockStatus,
  getStockStatusClass,
  getStockStatusLabel,
  LOW_STOCK_THRESHOLD,
} from "@/components/stocks/stock-utils"
import { StockQuantityEditor } from "@/components/stocks/stock-quantity-editor"
import { ChevronRight, Boxes } from "lucide-react"

interface StockTableProps {
  products: AdminProduct[]
  loading: boolean
  selectedProductId: string | null
  updatingProductId: string | null
  onProductOpen: (product: AdminProduct) => void
  onStockChange: (product: AdminProduct, nextStock: number) => void | Promise<void>
}

function reorderLabel(product: AdminProduct) {
  const status = getStockStatus(product)
  if (status === "out") return "Urgent"
  if (status === "low") return `< ${LOW_STOCK_THRESHOLD}`
  if (status === "inactive") return "Paused"
  return "Stable"
}

function reorderClass(product: AdminProduct) {
  const status = getStockStatus(product)
  if (status === "out") return "text-red-600 font-bold"
  if (status === "low") return "text-amber-600 font-bold"
  return "text-neutral-500"
}

// Loading skeleton
function TableSkeleton() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-neutral-100 bg-neutral-50 px-5 py-4">
        <div className="h-3 w-32 animate-pulse rounded bg-neutral-200" />
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-neutral-100 px-5 py-4">
          <div className="h-12 w-12 animate-pulse rounded-xl bg-neutral-100 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-40 animate-pulse rounded bg-neutral-100" />
            <div className="h-2.5 w-24 animate-pulse rounded bg-neutral-100" />
          </div>
          <div className="h-7 w-20 animate-pulse rounded-full bg-neutral-100" />
          <div className="h-9 w-32 animate-pulse rounded-xl bg-neutral-100" />
        </div>
      ))}
    </div>
  )
}

export function StockTable({
  products,
  loading,
  selectedProductId,
  updatingProductId,
  onProductOpen,
  onStockChange,
}: StockTableProps) {
  if (loading) return <TableSkeleton />

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-neutral-300 bg-white p-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100">
          <Boxes className="h-7 w-7 text-neutral-400" />
        </div>
        <div>
          <h3 className="font-serif text-2xl text-neutral-900">No results</h3>
          <p className="mt-2 text-sm text-neutral-500">Try clearing your search or changing the filter.</p>
        </div>
      </div>
    )
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      {/* ── Desktop table ────────────────────────────────── */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
          <colgroup>
            <col className="w-[30%]" />
            <col className="w-[13%]" />
            <col className="w-[11%]" />
            <col className="w-[20%]" />
            <col className="w-[10%]" />
            <col className="w-[9%]" />
            <col className="w-[7%]" />
          </colgroup>

          <thead className="border-b border-neutral-200 bg-neutral-50 text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400">
            <tr>
              <th className="px-5 py-3.5 text-left">Product</th>
              <th className="px-4 py-3.5 text-left">SKU</th>
              <th className="px-4 py-3.5 text-left">Status</th>
              <th className="px-4 py-3.5 text-left">Qty / Update</th>
              <th className="px-4 py-3.5 text-left">Price</th>
              <th className="px-4 py-3.5 text-left">Reorder</th>
              <th className="px-4 py-3.5 text-left">Store</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-100">
            {products.map((product) => {
              const status = getStockStatus(product)
              const image = getProductImage(product)
              const qty = getStockQuantity(product)
              const isSelected = selectedProductId === product.id
              const isUpdating = updatingProductId === product.id

              return (
                <tr
                  key={product.id}
                  className={cn(
                    "group transition-colors",
                    isSelected ? "bg-neutral-50 ring-1 ring-inset ring-neutral-200" : "hover:bg-neutral-50/50",
                    status === "out" && !isSelected && "bg-red-50/30 hover:bg-red-50/50",
                  )}
                >
                  {/* Product */}
                  <td className="px-5 py-3.5">
                    <button
                      type="button"
                      onClick={() => onProductOpen(product)}
                      className="group/btn flex w-full min-w-0 items-center gap-3 text-left"
                    >
                      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-100 bg-neutral-50">
                        {image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={image} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-[9px] font-bold uppercase text-neutral-400">IMG</span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="block truncate font-semibold text-neutral-900 group-hover/btn:underline">
                            {product.name || "Untitled"}
                          </span>
                          <ChevronRight className="h-3 w-3 shrink-0 text-neutral-300 group-hover/btn:text-neutral-600 transition-colors" />
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-neutral-400">
                          {[product.ml, product.scent || getProductCategoryName(product)].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                    </button>
                  </td>

                  {/* SKU */}
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-xs text-neutral-500">{getProductSku(product)}</span>
                  </td>

                  {/* Status badge */}
                  <td className="px-4 py-3.5">
                    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold", getStockStatusClass(status))}>
                      {getStockStatusLabel(status)}
                    </span>
                  </td>

                  {/* Qty + editor */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className={cn("w-10 shrink-0 text-right text-sm font-bold tabular-nums",
                        qty === 0 ? "text-red-600" : qty < LOW_STOCK_THRESHOLD ? "text-amber-600" : "text-neutral-700"
                      )}>
                        {qty.toLocaleString()}
                      </span>
                      <StockQuantityEditor
                        key={`${product.id}-${qty}`}
                        value={qty}
                        productName={product.name || "product"}
                        disabled={isUpdating}
                        onSave={(next) => onStockChange(product, next)}
                      />
                    </div>
                  </td>

                  {/* Price */}
                  <td className="px-4 py-3.5 font-semibold text-neutral-700">{formatMoney(product.price)}</td>

                  {/* Reorder */}
                  <td className={cn("px-4 py-3.5 text-xs", reorderClass(product))}>{reorderLabel(product)}</td>

                  {/* Catalog visibility */}
                  <td className="px-4 py-3.5">
                    <span className={cn("text-xs font-semibold",
                      product.show_in_catalog === false ? "text-neutral-400" : "text-emerald-600"
                    )}>
                      {product.show_in_catalog === false ? "Hidden" : "Live"}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Mobile cards ─────────────────────────────────── */}
      <div className="divide-y divide-neutral-100 lg:hidden">
        {products.map((product) => {
          const status = getStockStatus(product)
          const image = getProductImage(product)
          const qty = getStockQuantity(product)
          const isUpdating = updatingProductId === product.id

          return (
            <article
              key={product.id}
              className={cn(
                "p-4",
                status === "out" && "bg-red-50/30",
              )}
            >
              <div className="flex gap-3">
                {/* Image */}
                <button
                  type="button"
                  onClick={() => onProductOpen(product)}
                  className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-100 bg-neutral-50"
                >
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[9px] font-bold uppercase text-neutral-400">IMG</span>
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => onProductOpen(product)}
                        className="block w-full truncate text-left font-semibold text-neutral-900 hover:underline"
                      >
                        {product.name || "Untitled"}
                      </button>
                      <p className="mt-0.5 font-mono text-xs text-neutral-400">{getProductSku(product)}</p>
                    </div>
                    <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold", getStockStatusClass(status))}>
                      {getStockStatusLabel(status)}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <span className="flex items-center gap-1 rounded-xl bg-neutral-50 px-3 py-2 text-neutral-500">
                      Qty{" "}
                      <strong className={cn("ml-auto tabular-nums",
                        qty === 0 ? "text-red-600" : qty < LOW_STOCK_THRESHOLD ? "text-amber-600" : "text-neutral-900"
                      )}>
                        {qty.toLocaleString()}
                      </strong>
                    </span>
                    <span className="flex items-center gap-1 rounded-xl bg-neutral-50 px-3 py-2 text-neutral-500">
                      Size <strong className="ml-auto text-neutral-900">{product.ml || "—"}</strong>
                    </span>
                    <span className="flex items-center gap-1 rounded-xl bg-neutral-50 px-3 py-2 text-neutral-500">
                      Price <strong className="ml-auto text-neutral-900">{formatMoney(product.price)}</strong>
                    </span>
                    <span className={cn("flex items-center gap-1 rounded-xl px-3 py-2",
                      status === "out" ? "bg-red-50 text-red-600" : status === "low" ? "bg-amber-50 text-amber-600" : "bg-neutral-50 text-neutral-500"
                    )}>
                      Reorder <strong className="ml-auto">{reorderLabel(product)}</strong>
                    </span>
                  </div>

                  <div className="mt-3">
                    <StockQuantityEditor
                      key={`${product.id}-${qty}-mobile`}
                      value={qty}
                      productName={product.name || "product"}
                      disabled={isUpdating}
                      onSave={(next) => onStockChange(product, next)}
                    />
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
