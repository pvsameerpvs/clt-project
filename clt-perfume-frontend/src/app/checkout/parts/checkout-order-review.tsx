import Image from "next/image"
import { Button } from "@/components/ui/button"
import { AppliedPromo, CartItem } from "@/contexts/cart-context"
import { PaymentMethod } from "../checkout-types"
import { formatPrice } from "../checkout-utils"

interface CheckoutOrderReviewProps {
  items: CartItem[]
  currentUserId: string | null | undefined
  promoInputValue: string
  onPromoInputChange: (val: string) => void
  onApplyPromo: () => void
  promo: AppliedPromo | null
  isApplyingPromo: boolean
  removePromo: () => void
  promoMessage: string
  promoError: boolean
  totalItems: number
  totalPrice: number
  promoDiscountAmount: number
  discountedTotal: number
  onPlaceOrder: () => void
  isPlacingOrder: boolean
  paymentMethod: PaymentMethod
}

export function CheckoutOrderReview({
  items,
  currentUserId,
  promoInputValue,
  onPromoInputChange,
  onApplyPromo,
  promo,
  isApplyingPromo,
  removePromo,
  promoMessage,
  promoError,
  totalItems,
  totalPrice,
  promoDiscountAmount,
  discountedTotal,
  onPlaceOrder,
  isPlacingOrder,
  paymentMethod
}: CheckoutOrderReviewProps) {
  return (
    <aside className="h-fit rounded-2xl border border-neutral-100 bg-white p-5 md:p-6 lg:sticky lg:top-24 shadow-sm">
      <h2 className="mb-6 border-b border-neutral-100 pb-4 font-serif text-xl md:text-2xl text-neutral-900 flex items-center gap-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-[10px] text-white font-sans font-bold">4</span>
        Review Order
      </h2>

      <div className="mb-6 space-y-3">
        {items.map((item) => (
          <div key={`${item.bundle?.id || "single"}::${item.product.id}::${item.product.price}`} className="flex items-center gap-3">
            <div className="relative h-14 w-12 overflow-hidden rounded-lg bg-neutral-50 border border-neutral-100 flex-shrink-0">
              <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-neutral-900 leading-none">{item.product.name}</p>
              <div className="mt-1 flex items-center gap-2">
                <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-medium">Qty {item.quantity}</p>
                {item.product.ml && (
                  <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-medium">
                    <span className="mx-1">•</span> {item.product.ml}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-neutral-400 block leading-none font-medium">AED</span>
              <span className="text-xs font-semibold text-neutral-800">{formatPrice(Number(item.product.price) * item.quantity).replace("AED", "").trim()}</span>
            </div>
          </div>
        ))}
      </div>

      {currentUserId && (
        <div className="mb-4 rounded-xl border border-neutral-200 bg-neutral-50 p-3 sm:p-4">
          <p className="mb-2 text-[10px] uppercase tracking-[0.12em] text-neutral-500 sm:text-[11px]">Promo Code</p>
          <div className="flex items-center gap-2">
            <input
              value={promoInputValue}
              onChange={(event) => onPromoInputChange(event.target.value.toUpperCase())}
              placeholder="ENTER CODE"
              disabled={Boolean(promo)}
              className="h-11 min-w-0 flex-1 rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none transition-colors focus:border-black placeholder:text-neutral-400"
            />
            <button
              type="button"
              onClick={onApplyPromo}
              disabled={isApplyingPromo || Boolean(promo)}
              className="h-11 min-w-[90px] rounded-lg bg-black px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
            >
              {promo ? "Applied" : isApplyingPromo ? "Applying" : "Apply"}
            </button>
          </div>
          {promo && (
            <div className="mt-2 flex flex-col gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-xs text-emerald-800 sm:flex-row sm:items-center sm:justify-between">
              <span className="break-all font-medium">
                {promo.code} ({promo.discountType === "percentage" ? `${promo.discountValue}%` : `AED ${promo.discountValue}`})
              </span>
              <button type="button" onClick={removePromo} className="self-start font-semibold hover:text-black sm:self-auto">
                Remove
              </button>
            </div>
          )}
          {promoMessage && <p className={`mt-2 text-xs ${promoError ? "text-red-600" : "text-emerald-700"}`}>{promoMessage}</p>}
        </div>
      )}

      <div className="space-y-3 text-[11px] uppercase tracking-wider text-neutral-500 font-medium">
        <div className="flex justify-between"><span>Items ({totalItems})</span><span className="text-neutral-900">{formatPrice(totalPrice)}</span></div>
        {promo && promoDiscountAmount > 0 && (
          <div className="flex justify-between text-emerald-600"><span>Promo Discount</span><span>- {formatPrice(promoDiscountAmount)}</span></div>
        )}
        <div className="flex justify-between"><span>Shipping</span><span className="text-green-600">FREE</span></div>
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-neutral-100 pt-6">
        <div className="text-left">
          <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold leading-none mb-1">Grand Total</p>
          <p className="font-serif text-3xl text-neutral-900 leading-none">{formatPrice(discountedTotal)}</p>
        </div>
      </div>

      <Button
        onClick={onPlaceOrder}
        disabled={isPlacingOrder}
        className="mt-6 h-14 w-full rounded-xl bg-black text-white hover:bg-neutral-800 uppercase tracking-[0.14em] text-xs font-semibold disabled:opacity-60"
      >
        {isPlacingOrder
          ? "Processing..."
          : paymentMethod === "cod"
            ? "Place COD Order"
            : "Pay Securely"}
      </Button>

      <p className="mt-3 text-center text-[11px] uppercase tracking-[0.12em] text-neutral-500">
        {paymentMethod === "cod" ? "Cash on delivery selected" : "You will be redirected to secure bank payment"}
      </p>
    </aside>
  )
}
