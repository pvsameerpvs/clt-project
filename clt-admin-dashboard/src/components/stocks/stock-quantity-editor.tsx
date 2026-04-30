"use client"

import { Check, Loader2, Minus, Plus } from "lucide-react"
import { useState } from "react"

interface StockQuantityEditorProps {
  value: number
  disabled?: boolean
  productName: string
  onSave: (nextStock: number) => void | Promise<void>
}

function normalizeStockValue(value: string | number) {
  const parsed = Math.floor(Number(value))
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

export function StockQuantityEditor({ value, disabled, productName, onSave }: StockQuantityEditorProps) {
  const [draftValue, setDraftValue] = useState(String(value))
  const nextStock = normalizeStockValue(draftValue)
  const isDirty = nextStock !== value

  function adjustStock(delta: number) {
    const current = normalizeStockValue(draftValue)
    setDraftValue(String(Math.max(0, current + delta)))
  }

  function handleSave() {
    if (!isDirty || disabled) return
    void onSave(nextStock)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSave()
    if (e.key === "Escape") setDraftValue(String(value))
  }

  return (
    <div
      className="inline-flex items-center gap-1 rounded-xl border border-neutral-200 bg-white p-1 shadow-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => adjustStock(-1)}
        disabled={disabled || nextStock <= 0}
        aria-label={`Decrease stock for ${productName}`}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-neutral-100 hover:text-black disabled:cursor-not-allowed disabled:opacity-30"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>

      <input
        type="number"
        min={0}
        inputMode="numeric"
        value={draftValue}
        disabled={disabled}
        onChange={(e) => setDraftValue(e.target.value)}
        onBlur={() => setDraftValue(String(nextStock))}
        onKeyDown={handleKeyDown}
        aria-label={`Stock quantity for ${productName}`}
        className="h-7 w-14 rounded-lg bg-neutral-50 px-1 text-center text-sm font-semibold text-neutral-900 outline-none transition focus:bg-white focus:ring-2 focus:ring-black disabled:text-neutral-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />

      <button
        type="button"
        onClick={() => adjustStock(1)}
        disabled={disabled}
        aria-label={`Increase stock for ${productName}`}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-neutral-100 hover:text-black disabled:cursor-not-allowed disabled:opacity-30"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={handleSave}
        disabled={disabled || !isDirty}
        aria-label={`Save stock for ${productName}`}
        title={isDirty ? `Save: set to ${nextStock}` : "No changes"}
        className={`flex h-7 min-w-8 items-center justify-center gap-1 rounded-lg px-2 text-[10px] font-bold transition ${
          isDirty && !disabled
            ? "bg-black text-white hover:bg-neutral-800"
            : "cursor-not-allowed bg-neutral-100 text-neutral-400"
        }`}
      >
        {disabled ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Check className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  )
}
