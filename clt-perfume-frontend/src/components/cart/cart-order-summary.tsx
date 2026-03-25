"use client"

import { ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { AppliedPromo } from "@/contexts/cart-context"

export type CartSummaryLine = {
  key: string
  label: string
  quantity: number
  value: number
}

type CartOrderSummaryProps = {
  lines: CartSummaryLine[]
  totalPrice: number
  discountedTotal: number
  promo: AppliedPromo | null
  promoDiscountAmount: number
  promoInputValue: string
  promoMessage: string
  promoError: boolean
  isApplyingPromo: boolean
  onPromoInputChange: (value: string) => void
  onApplyPromo: () => void
  onRemovePromo: () => void
  onProceedCheckout: () => void
}

function formatPrice(value: number) {
  return `AED ${Math.round(Number(value) || 0)}`
}

export function CartOrderSummary({
  lines,
  totalPrice,
  discountedTotal,
  promo,
  promoDiscountAmount,
  promoInputValue,
  promoMessage,
  promoError,
  isApplyingPromo,
  onPromoInputChange,
  onApplyPromo,
  onRemovePromo,
  onProceedCheckout,
}: CartOrderSummaryProps) {
  return (
    <div className="rounded-2xl border border-neutral-100 bg-white p-8 shadow-sm">
      <h2 className="mb-6 border-b border-neutral-100 pb-4 text-xl font-serif">Order Summary</h2>

      <div className="mb-6 space-y-2">
        {lines.map((line) => (
          <div key={line.key} className="flex items-center justify-between text-sm">
            <span className="text-neutral-700">
              {line.label}
              <span className="text-neutral-500"> x{line.quantity}</span>
            </span>
            <span className="font-medium text-neutral-900">{formatPrice(line.value)}</span>
          </div>
        ))}
      </div>

      <div className="mb-6 rounded-xl border border-neutral-200 bg-neutral-50 p-3 sm:p-4">
        <p className="mb-2 text-[10px] uppercase tracking-[0.12em] text-neutral-500 sm:text-[11px]">Promo Code</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={promoInputValue}
            onChange={(event) => onPromoInputChange(event.target.value.toUpperCase())}
            placeholder="ENTER CODE"
            disabled={Boolean(promo)}
            className="h-10 min-w-0 flex-1 rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none transition-colors focus:border-black sm:h-11"
          />
          <button
            type="button"
            onClick={onApplyPromo}
            disabled={isApplyingPromo || Boolean(promo)}
            className="h-10 w-full rounded-lg bg-black px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-neutral-800 disabled:opacity-50 sm:h-11 sm:w-auto sm:min-w-[110px]"
          >
            {promo ? "Applied" : isApplyingPromo ? "Applying" : "Apply"}
          </button>
        </div>

        {promo && (
          <div className="mt-2 flex flex-col gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-xs text-emerald-800 sm:flex-row sm:items-center sm:justify-between">
            <span className="break-all">
              {promo.code} ({promo.discountType === "percentage" ? `${promo.discountValue}%` : `AED ${promo.discountValue}`})
            </span>
            <button type="button" onClick={onRemovePromo} className="self-start font-semibold hover:text-black sm:self-auto">
              Remove
            </button>
          </div>
        )}

        {promoMessage && (
          <p className={`mt-2 text-xs leading-relaxed ${promoError ? "text-red-600" : "text-emerald-700"}`}>
            {promoMessage}
          </p>
        )}
      </div>

      <div className="mb-6 flex items-end justify-between border-t border-neutral-100 pt-6 text-neutral-900">
        <span className="font-serif">Total</span>
        <span className="text-2xl font-serif">{formatPrice(discountedTotal)}</span>
      </div>

      <Button
        onClick={onProceedCheckout}
        className="h-14 w-full rounded-xl bg-black text-xs font-medium uppercase tracking-widest text-white shadow-lg shadow-black/10 transition-all hover:bg-neutral-800"
      >
        Proceed to Checkout
      </Button>

      <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-center text-[11px] uppercase tracking-[0.12em] text-neutral-600">
        Address and payment options on next step
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-neutral-500">
        <ShieldCheck className="h-4 w-4" />
        <span className="text-[10px] font-medium uppercase tracking-widest">Secure Order Placement</span>
      </div>
    </div>
  )
}
