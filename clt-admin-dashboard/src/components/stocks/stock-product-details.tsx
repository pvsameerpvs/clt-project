"use client"

import { ExternalLink, Loader2, RefreshCcw, X, TrendingUp, RotateCcw, ShoppingBag } from "lucide-react"
import type { AdminProduct, ProductStockInsights } from "@/lib/admin-api"
import { getStorefrontUrl } from "@/lib/public-config"
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

interface StockProductDetailsProps {
  product: AdminProduct | null
  insights: ProductStockInsights | null
  loading: boolean
  error: string | null
  onClose: () => void
  onRefresh: () => void
}

const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

function formatDate(value: string | null | undefined) {
  if (!value) return "Never"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Never"
  return dateFormatter.format(date)
}

function formatStatus(status: string) {
  return status
    .split("_")
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ")
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-blue-100 text-blue-700",
    processing: "bg-blue-100 text-blue-700",
    shipped: "bg-purple-100 text-purple-700",
    delivered: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
    refunded: "bg-neutral-100 text-neutral-600",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
  }
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", map[status.toLowerCase()] || "bg-neutral-100 text-neutral-600")}>
      {formatStatus(status)}
    </span>
  )
}

export function StockProductDetails({
  product,
  insights,
  loading,
  error,
  onClose,
  onRefresh,
}: StockProductDetailsProps) {
  // Empty state
  if (!product) {
    return (
      <aside className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-neutral-200 bg-white p-8 text-center shadow-sm xl:sticky xl:top-6 xl:self-start">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100">
          <ShoppingBag className="h-7 w-7 text-neutral-300" />
        </div>
        <div>
          <h2 className="font-serif text-xl text-neutral-800">Product Insight</h2>
          <p className="mx-auto mt-2 max-w-[220px] text-sm leading-6 text-neutral-400">
            Click any product in the table to see sales, order history, and return requests.
          </p>
        </div>
      </aside>
    )
  }

  const image = getProductImage(product)
  const status = getStockStatus(product)
  const qty = getStockQuantity(product)
  const productUrl = product.slug ? `${getStorefrontUrl()}/product/${product.slug}` : ""

  const metricCards = [
    { label: "Ordered Qty", value: (insights?.totalQuantity || 0).toLocaleString(), icon: TrendingUp },
    { label: "Total Orders", value: (insights?.totalOrders || 0).toLocaleString(), icon: ShoppingBag },
    { label: "Customers", value: (insights?.uniqueCustomers || 0).toLocaleString(), icon: ShoppingBag },
    { label: "Gross Sales", value: formatMoney(insights?.grossSales || 0), icon: TrendingUp },
    { label: "Returns", value: (insights?.returnRequests || 0).toLocaleString(), icon: RotateCcw },
    { label: "Pending Returns", value: (insights?.pendingReturns || 0).toLocaleString(), icon: RotateCcw },
  ]

  return (
    <aside className="rounded-2xl border border-neutral-200 bg-white shadow-sm xl:sticky xl:top-6 xl:self-start">
      {/* ─── Header ─────────────────────────── */}
      <div className="border-b border-neutral-100 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 gap-3">
            {/* Product image */}
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-100 bg-neutral-50">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-[9px] font-bold uppercase text-neutral-400">No img</span>
              )}
            </div>
            {/* Name + badges */}
            <div className="min-w-0">
              <span className={cn("inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold", getStockStatusClass(status))}>
                {getStockStatusLabel(status)}
              </span>
              <h2 className="mt-1.5 line-clamp-2 font-serif text-xl font-semibold leading-tight text-neutral-900">
                {product.name || "Untitled product"}
              </h2>
              <p className="mt-0.5 font-mono text-[11px] text-neutral-400">{getProductSku(product)}</p>
            </div>
          </div>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close insight panel"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-400 transition hover:border-black hover:text-black"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Quick facts */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl bg-neutral-50 p-3">
            <p className="font-bold uppercase tracking-widest text-neutral-400">Stock Qty</p>
            <p className={cn("mt-1 text-xl font-bold tabular-nums",
              qty === 0 ? "text-red-600" : qty < LOW_STOCK_THRESHOLD ? "text-amber-600" : "text-neutral-900"
            )}>
              {qty.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl bg-neutral-50 p-3">
            <p className="font-bold uppercase tracking-widest text-neutral-400">Last Order</p>
            <p className="mt-1 text-sm font-semibold text-neutral-700">{formatDate(insights?.lastOrderedAt)}</p>
          </div>
          <div className="rounded-xl bg-neutral-50 p-3">
            <p className="font-bold uppercase tracking-widest text-neutral-400">Size</p>
            <p className="mt-1 text-sm font-semibold text-neutral-700">{product.ml || "—"}</p>
          </div>
          <div className="rounded-xl bg-neutral-50 p-3">
            <p className="font-bold uppercase tracking-widest text-neutral-400">Category</p>
            <p className="mt-1 truncate text-sm font-semibold text-neutral-700">{getProductCategoryName(product)}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="flex h-9 items-center gap-2 rounded-xl border border-neutral-200 px-3 text-xs font-bold uppercase tracking-wider text-neutral-600 transition hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCcw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </button>
          {productUrl && (
            <a
              href={productUrl}
              target="_blank"
              rel="noreferrer"
              className="flex h-9 items-center gap-2 rounded-xl border border-neutral-200 px-3 text-xs font-bold uppercase tracking-wider text-neutral-600 transition hover:border-black hover:text-black"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View in Store
            </a>
          )}
        </div>
      </div>

      {/* ─── Body ─────────────────────────────── */}
      <div className="space-y-6 p-5">
        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* Metric cards */}
        <section>
          <h3 className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Sales Overview</h3>
          {loading && !insights ? (
            <div className="grid grid-cols-2 gap-2">
              {metricCards.map((c) => (
                <div key={c.label} className="h-16 animate-pulse rounded-xl bg-neutral-100" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {metricCards.map((card) => (
                <div key={card.label} className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{card.label}</p>
                  <p className="mt-1.5 text-lg font-bold text-neutral-900 tabular-nums">{card.value}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Orders */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Recent Orders</h3>
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-300" />}
          </div>

          {insights?.recentOrders.length ? (
            <div className="divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-100">
              {insights.recentOrders.map((order) => (
                <a
                  key={order.orderId}
                  href={`/dashboard/orders/${order.orderId}`}
                  className="block p-3 transition hover:bg-neutral-50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-neutral-900">{order.orderNumber}</p>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-neutral-400">{order.customerName}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-neutral-500">
                    <span>Qty <strong className="text-neutral-800">{order.quantity}</strong></span>
                    <span>·</span>
                    <span>{formatMoney(order.lineTotal)}</span>
                    <span>·</span>
                    <span>{formatDate(order.createdAt)}</span>
                  </div>
                </a>
              ))}
            </div>
          ) : !loading ? (
            <div className="rounded-xl border border-dashed border-neutral-200 p-4 text-center text-sm text-neutral-400">
              No order history for this product.
            </div>
          ) : null}
        </section>

        {/* Return Requests */}
        <section>
          <h3 className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Return Requests</h3>

          {insights?.recentReturns.length ? (
            <div className="divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-100">
              {insights.recentReturns.map((req) => (
                <div key={req.id} className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-neutral-900">{req.orderNumber || "Order"}</p>
                    <StatusBadge status={req.status} />
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-neutral-500">
                    {req.reason || "No reason provided"}
                  </p>
                  <p className="mt-1.5 text-[11px] text-neutral-400">{formatDate(req.createdAt)}</p>
                </div>
              ))}
            </div>
          ) : !loading ? (
            <div className="rounded-xl border border-dashed border-neutral-200 p-4 text-center text-sm text-neutral-400">
              No return requests for this product.
            </div>
          ) : null}
        </section>
      </div>
    </aside>
  )
}
