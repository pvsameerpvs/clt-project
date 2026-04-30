"use client"

import { Filter, RefreshCcw, Search, X } from "lucide-react"
import type { StockFilter } from "@/components/stocks/stock-utils"

interface StockToolbarProps {
  query: string
  onQueryChange: (query: string) => void
  stockFilter: StockFilter
  onStockFilterChange: (filter: StockFilter) => void
  sizeFilter: string
  onSizeFilterChange: (size: string) => void
  sizes: string[]
  resultCount: number
  loading: boolean
  onRefresh: () => void
}

const STOCK_FILTERS: Array<{ value: StockFilter; label: string; dot?: string }> = [
  { value: "all", label: "All" },
  { value: "ready", label: "Ready", dot: "bg-emerald-500" },
  { value: "low", label: "Low", dot: "bg-amber-500" },
  { value: "out", label: "Out", dot: "bg-red-500" },
  { value: "inactive", label: "Inactive", dot: "bg-neutral-400" },
]

export function StockToolbar({
  query,
  onQueryChange,
  stockFilter,
  onStockFilterChange,
  sizeFilter,
  onSizeFilterChange,
  sizes,
  resultCount,
  loading,
  onRefresh,
}: StockToolbarProps) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-3 p-4">
        {/* Search */}
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-10 pr-10 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-black focus:bg-white focus:ring-2 focus:ring-black/10"
            placeholder="Search name, SKU, category, scent…"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-neutral-400 hover:text-black"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </label>

        {/* Size filter */}
        {sizes.length > 0 && (
          <label className="flex h-11 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 transition hover:border-neutral-300">
            <span className="text-xs font-semibold text-neutral-400">Size</span>
            <select
              className="min-w-[6rem] bg-transparent text-sm font-semibold text-neutral-900 outline-none"
              value={sizeFilter}
              onChange={(e) => onSizeFilterChange(e.target.value)}
            >
              <option value="">All</option>
              {sizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        )}

        {/* Stock filter */}
        <label className="flex h-11 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 transition hover:border-neutral-300">
          <Filter className="h-3.5 w-3.5 text-neutral-400" />
          <select
            className="min-w-[6rem] bg-transparent text-sm font-semibold text-neutral-900 outline-none"
            value={stockFilter}
            onChange={(e) => onStockFilterChange(e.target.value as StockFilter)}
          >
            {STOCK_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>

        {/* Refresh */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="flex h-11 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-xs font-bold uppercase tracking-widest text-neutral-700 transition hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Quick-filter pills */}
      <div className="flex flex-wrap items-center gap-2 border-t border-neutral-100 px-4 py-3">
        {STOCK_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => onStockFilterChange(f.value)}
            className={`flex h-7 items-center gap-1.5 rounded-full border px-3 text-[11px] font-bold transition ${
              stockFilter === f.value
                ? "border-black bg-black text-white"
                : "border-neutral-200 bg-neutral-50 text-neutral-500 hover:border-neutral-400 hover:text-neutral-800"
            }`}
          >
            {f.dot && <span className={`h-1.5 w-1.5 rounded-full ${f.dot}`} />}
            {f.label}
          </button>
        ))}

        <p className="ml-auto text-xs font-semibold text-neutral-400">
          {loading ? "Loading…" : `${resultCount.toLocaleString()} item${resultCount !== 1 ? "s" : ""}`}
        </p>
      </div>
    </section>
  )
}
