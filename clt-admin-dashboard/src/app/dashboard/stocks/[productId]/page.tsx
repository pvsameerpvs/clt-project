"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, ExternalLink, Loader2, RefreshCcw, RotateCcw, ShoppingBag, TrendingUp } from "lucide-react"
import type { AdminProduct, ProductStockInsights } from "@/lib/admin-api"
import { getAdminProduct, getAdminProductStockInsights, updateAdminProduct } from "@/lib/admin-api"
import { getStorefrontUrl } from "@/lib/public-config"
import { StockQuantityEditor } from "@/components/stocks/stock-quantity-editor"
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
import { cn } from "@/lib/utils"

// ─── Helpers ───────────────────────────────────────────────────────────────────
const dateFmt = new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric" })
function fmtDate(value: string | null | undefined) {
  if (!value) return "Never"
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? "Never" : dateFmt.format(d)
}

function fmtStatus(s: string) {
  return s.split("_").filter(Boolean).map((p) => p[0].toUpperCase() + p.slice(1)).join(" ")
}

// ─── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending:    "bg-amber-100 text-amber-700",
    confirmed:  "bg-blue-100 text-blue-700",
    processing: "bg-blue-100 text-blue-700",
    shipped:    "bg-purple-100 text-purple-700",
    delivered:  "bg-emerald-100 text-emerald-700",
    cancelled:  "bg-red-100 text-red-700",
    refunded:   "bg-neutral-100 text-neutral-600",
    approved:   "bg-emerald-100 text-emerald-700",
    rejected:   "bg-red-100 text-red-700",
  }
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase", map[status.toLowerCase()] || "bg-neutral-100 text-neutral-600")}>
      {fmtStatus(status)}
    </span>
  )
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-neutral-100", className)} />
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function StockProductPage() {
  const router   = useRouter()
  const params   = useParams()
  const productId = String(params.productId || "")

  const [product,         setProduct]         = useState<AdminProduct | null>(null)
  const [insights,        setInsights]        = useState<ProductStockInsights | null>(null)
  const [loadingProduct,  setLoadingProduct]  = useState(true)
  const [loadingInsights, setLoadingInsights] = useState(true)
  const [saving,          setSaving]          = useState(false)
  const [error,           setError]           = useState<string | null>(null)
  const [insightError,    setInsightError]    = useState<string | null>(null)
  const [saveSuccess,     setSaveSuccess]     = useState(false)

  // Load single product by ID
  useEffect(() => {
    if (!productId) return
    async function load() {
      try {
        setLoadingProduct(true)
        setError(null)
        setProduct(await getAdminProduct(productId))
      } catch {
        setError("Product not found.")
      } finally {
        setLoadingProduct(false)
      }
    }
    void load()
  }, [productId])

  // Load insights
  const loadInsights = useCallback(async () => {
    if (!productId) return
    try {
      setLoadingInsights(true)
      setInsightError(null)
      setInsights(await getAdminProductStockInsights(productId))
    } catch (e) {
      setInsightError(e instanceof Error ? e.message : "Failed to load insights.")
    } finally {
      setLoadingInsights(false)
    }
  }, [productId])

  useEffect(() => { void loadInsights() }, [loadInsights])

  // Save updated stock
  async function handleStockSave(nextStock: number) {
    if (!product) return
    try {
      setSaving(true)
      const updated = await updateAdminProduct(product.id, { stock: nextStock })
      setProduct((prev) => prev ? { ...prev, stock: Number(updated.stock ?? nextStock) } : prev)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2500)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update stock.")
    } finally {
      setSaving(false)
    }
  }

  // Derived
  const qty        = product ? getStockQuantity(product) : 0
  const status     = product ? getStockStatus(product)   : "inactive"
  const image      = product ? getProductImage(product)  : ""
  const productUrl = product?.slug ? `${getStorefrontUrl()}/product/${product.slug}` : ""

  const metricCards = [
    { label: "Ordered Qty",     value: (insights?.totalQuantity   || 0).toLocaleString(), icon: TrendingUp },
    { label: "Total Orders",    value: (insights?.totalOrders      || 0).toLocaleString(), icon: ShoppingBag },
    { label: "Customers",       value: (insights?.uniqueCustomers  || 0).toLocaleString(), icon: ShoppingBag },
    { label: "Gross Sales",     value: formatMoney(insights?.grossSales || 0),             icon: TrendingUp },
    { label: "Returns",         value: (insights?.returnRequests   || 0).toLocaleString(), icon: RotateCcw },
    { label: "Pending Returns", value: (insights?.pendingReturns   || 0).toLocaleString(), icon: RotateCcw },
  ]

  // Stock panel tone
  const stockTone =
    qty === 0              ? { bg: "bg-red-50",    border: "border-red-100",    num: "text-red-600",    tag: "bg-red-100 text-red-700",       dot: "bg-red-500",    label: "Out of Stock" }
    : qty < LOW_STOCK_THRESHOLD ? { bg: "bg-amber-50",  border: "border-amber-100",  num: "text-amber-600",  tag: "bg-amber-100 text-amber-700",   dot: "bg-amber-500",  label: "Running Low" }
    : status === "inactive" ? { bg: "bg-neutral-50", border: "border-neutral-200", num: "text-neutral-400", tag: "bg-neutral-100 text-neutral-500", dot: "bg-neutral-400", label: "Inactive" }
    :                         { bg: "bg-emerald-50", border: "border-emerald-100", num: "text-neutral-900", tag: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", label: "" }

  return (
    <div className="mx-auto max-w-[1100px] space-y-8">

      {/* Back button */}
      <button
        type="button"
        onClick={() => router.push("/dashboard/stocks")}
        className="group flex items-center gap-2 text-sm font-semibold text-neutral-400 transition hover:text-black"
      >
        <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" />
        Back to Stocks
      </button>

      {/* ──────── PRODUCT HEADER CARD ──────────────────────────────── */}
      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">

        {/* Loading skeleton */}
        {loadingProduct && (
          <div className="flex items-center gap-6 p-8">
            <Skeleton className="h-28 w-28 shrink-0 rounded-2xl" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-9 w-72" />
              <div className="flex gap-2">
                <Skeleton className="h-7 w-20 rounded-lg" />
                <Skeleton className="h-7 w-16 rounded-lg" />
                <Skeleton className="h-7 w-24 rounded-lg" />
              </div>
            </div>
            <Skeleton className="h-36 w-44 shrink-0 rounded-2xl" />
          </div>
        )}

        {/* Not found */}
        {!loadingProduct && !product && (
          <div className="p-10 text-center text-sm text-neutral-400">
            {error || "Product not found."}
          </div>
        )}

        {/* Product loaded */}
        {!loadingProduct && product && (
          <div className="flex flex-col sm:flex-row">

            {/* ── Left: product info ── */}
            <div className="flex min-w-0 flex-1 items-start gap-5 p-7">

              {/* Image */}
              <div className="flex h-[108px] w-[108px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-50 shadow-sm">
                {image
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={image} alt={product.name} className="h-full w-full object-cover" />
                  : <span className="text-[9px] font-bold uppercase text-neutral-300">No Image</span>
                }
              </div>

              {/* Text */}
              <div className="min-w-0 flex-1 pt-0.5">
                {/* Status pill */}
                <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold", getStockStatusClass(status))}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", stockTone.dot)} />
                  {getStockStatusLabel(status)}
                </span>

                {/* Name */}
                <h1 className="mt-2 font-serif text-[1.85rem] font-semibold leading-tight tracking-tight text-neutral-900 md:text-4xl">
                  {product.name || "Untitled Product"}
                </h1>

                {/* Meta chips */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="flex items-center gap-1.5 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-1.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">SKU</span>
                    <span className="font-mono text-xs font-bold text-neutral-800">{getProductSku(product)}</span>
                  </span>

                  {product.ml && (
                    <span className="flex items-center gap-1.5 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-1.5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Size</span>
                      <span className="text-xs font-bold text-neutral-800">{product.ml}</span>
                    </span>
                  )}

                  <span className="flex items-center gap-1.5 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-1.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Category</span>
                    <span className="text-xs font-bold text-neutral-800">{getProductCategoryName(product)}</span>
                  </span>

                  <span className="flex items-center gap-1.5 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-1.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Price</span>
                    <span className="text-xs font-bold text-neutral-800">{formatMoney(product.price)}</span>
                  </span>

                  <span className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold",
                    product.show_in_catalog === false
                      ? "border-neutral-100 bg-neutral-50 text-neutral-400"
                      : "border-emerald-100 bg-emerald-50 text-emerald-700"
                  )}>
                    <span className={cn("h-1.5 w-1.5 rounded-full",
                      product.show_in_catalog === false ? "bg-neutral-300" : "bg-emerald-500"
                    )} />
                    {product.show_in_catalog === false ? "Hidden from Store" : "Live in Store"}
                  </span>
                </div>

                {/* Store link */}
                {productUrl && (
                  <a
                    href={productUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex h-9 items-center gap-2 rounded-xl border border-neutral-200 px-4 text-xs font-bold uppercase tracking-wider text-neutral-600 transition hover:border-black hover:bg-neutral-50 hover:text-black"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View in Store
                  </a>
                )}
              </div>
            </div>

            {/* ── Right: stock panel ── */}
            <div className={cn(
              "flex shrink-0 flex-col items-center justify-center gap-5 border-t p-7 sm:w-52 sm:border-l sm:border-t-0",
              stockTone.bg, stockTone.border
            )}>
              {/* Big number */}
              <div className="text-center">
                <p className="text-[9px] font-black uppercase tracking-[0.28em] text-neutral-400">
                  Current Stock
                </p>
                <p className={cn("mt-1 font-serif text-6xl font-bold leading-none tabular-nums", stockTone.num)}>
                  {qty.toLocaleString()}
                </p>
                <p className="mt-1 text-[11px] font-medium text-neutral-400">units</p>

                {stockTone.label && (
                  <span className={cn("mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold", stockTone.tag)}>
                    {stockTone.label}
                  </span>
                )}
              </div>

              {/* Editor */}
              <div className="flex flex-col items-center gap-1.5">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400">Update Qty</p>
                <StockQuantityEditor
                  key={`editor-${qty}`}
                  value={qty}
                  productName={product.name || "product"}
                  disabled={saving}
                  onSave={handleStockSave}
                />
                {saving && (
                  <p className="flex items-center gap-1 text-[11px] text-neutral-400">
                    <Loader2 className="h-3 w-3 animate-spin" /> Saving…
                  </p>
                )}
                {saveSuccess && (
                  <p className="text-[11px] font-bold text-emerald-600">✓ Updated</p>
                )}
              </div>
            </div>

          </div>
        )}
      </section>

      {/* Error banner */}
      {error && !loadingProduct && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* ──────── INSIGHTS GRID ────────────────────────────────────── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-neutral-400">Sales Overview</p>
            <h2 className="mt-0.5 font-serif text-2xl font-semibold text-neutral-900">Product Insights</h2>
          </div>
          <button
            type="button"
            onClick={loadInsights}
            disabled={loadingInsights}
            className="flex h-9 items-center gap-2 rounded-xl border border-neutral-200 px-4 text-xs font-bold uppercase tracking-wider text-neutral-600 transition hover:border-black hover:text-black disabled:opacity-50"
          >
            <RefreshCcw className={cn("h-3.5 w-3.5", loadingInsights && "animate-spin")} />
            Refresh
          </button>
        </div>

        {insightError && (
          <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {insightError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {metricCards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              {loadingInsights ? (
                <>
                  <Skeleton className="mb-3 h-3 w-16" />
                  <Skeleton className="h-7 w-12" />
                </>
              ) : (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{card.label}</p>
                  <p className="mt-2 font-serif text-2xl font-semibold tabular-nums text-neutral-900">{card.value}</p>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ──────── ORDERS + RETURNS ─────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Recent Orders */}
        <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="border-b border-neutral-100 px-6 py-4">
            <h3 className="font-semibold text-neutral-900">Recent Orders</h3>
            <p className="mt-0.5 text-xs text-neutral-400">Orders containing this product</p>
          </div>
          <div className="divide-y divide-neutral-100">
            {loadingInsights
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2 p-4">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                ))
              : insights?.recentOrders.length
              ? insights.recentOrders.map((order) => (
                  <a
                    key={order.orderId}
                    href={`/dashboard/orders/${order.orderId}`}
                    className="block p-4 transition hover:bg-neutral-50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-neutral-900">{order.orderNumber}</p>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="mt-0.5 text-xs text-neutral-400">{order.customerName}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 text-xs text-neutral-500">
                      <span>Qty <strong className="text-neutral-800">{order.quantity}</strong></span>
                      <span>{formatMoney(order.lineTotal)}</span>
                      <span>{fmtDate(order.createdAt)}</span>
                    </div>
                  </a>
                ))
              : (
                <div className="p-10 text-center text-sm text-neutral-400">No order history yet.</div>
              )
            }
          </div>
        </section>

        {/* Return Requests */}
        <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="border-b border-neutral-100 px-6 py-4">
            <h3 className="font-semibold text-neutral-900">Return Requests</h3>
            <p className="mt-0.5 text-xs text-neutral-400">Returns linked to orders with this product</p>
          </div>
          <div className="divide-y divide-neutral-100">
            {loadingInsights
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2 p-4">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                ))
              : insights?.recentReturns.length
              ? insights.recentReturns.map((req) => (
                  <div key={req.id} className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-neutral-900">{req.orderNumber || "Order"}</p>
                      <StatusBadge status={req.status} />
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-neutral-500">
                      {req.reason || "No reason provided"}
                    </p>
                    <p className="mt-1 text-[11px] text-neutral-400">{fmtDate(req.createdAt)}</p>
                  </div>
                ))
              : (
                <div className="p-10 text-center text-sm text-neutral-400">No return requests.</div>
              )
            }
          </div>
        </section>

      </div>
    </div>
  )
}
