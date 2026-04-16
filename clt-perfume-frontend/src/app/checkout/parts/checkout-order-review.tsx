import Image from "next/image"
import { Button } from "@/components/ui/button"
import { CartItem } from "@/contexts/cart-context"
import { PaymentMethod } from "../checkout-types"
import { formatPrice } from "../checkout-utils"

interface CheckoutOrderReviewProps {
  items: CartItem[]
  currentUserId: string | null | undefined
  promoInputValue: string
  onPromoInputChange: (val: string) => void
  onApplyPromo: () => void
  promo: any
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
    <aside className="h-fit rounded-2xl border border-neutral-200 bg-white p-5 md:p-6 lg:sticky lg:top-24">
      <h2 className="mb-4 border-b border-neutral-100 pb-3 font-serif text-2xl text-neutral-900">4. Review Order</h2>

      <div className="mb-4 space-y-2">
        {items.map((item) => (
          <div key={`${item.product.id}-${item.bundle?.id || "single"}`} className="flex items-center gap-3 rounded-lg border border-neutral-100 p-2">
            <div className="relative h-12 w-12 overflow-hidden rounded-md bg-neutral-100">
              <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-neutral-900">{item.product.name}</p>
              <p className="text-xs text-neutral-500">Qty {item.quantity}</p>
            </div>
            <p className="text-sm font-semibold text-neutral-800">{formatPrice(Number(item.product.price) * item.quantity)}</p>
          </div>
        ))}
      </div>

      {currentUserId && (
        <div className="mb-4 rounded-xl border border-neutral-200 bg-neutral-50 p-3 sm:p-4">
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

      <div className="space-y-3 text-sm text-neutral-600">
        <div className="flex justify-between"><span>Items ({totalItems})</span><span className="font-medium text-black">{formatPrice(totalPrice)}</span></div>
        {promo && promoDiscountAmount > 0 && (
          <div className="flex justify-between text-emerald-700"><span>Promo Discount</span><span>- {formatPrice(promoDiscountAmount)}</span></div>
        )}
        <div className="flex justify-between"><span>Shipping</span><span className="font-medium text-green-700">FREE</span></div>
      </div>

      <div className="mt-5 flex items-end justify-between border-t border-neutral-100 pt-5">
        <span className="font-serif text-lg">Total</span>
        <span className="font-serif text-2xl">{formatPrice(discountedTotal)}</span>
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
