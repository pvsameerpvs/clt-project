"use client"

import Image from "next/image"
import { Package2 } from "lucide-react"
import { formatPrice } from "../../checkout-utils"
import type { CheckoutSuccessSnapshotItem } from "../../checkout-success-storage"

type CheckoutSuccessSummaryProps = {
  items: CheckoutSuccessSnapshotItem[]
  subtotal?: number
  discount?: number
  total?: number
}

function createItemKey(item: CheckoutSuccessSnapshotItem) {
  return `${item.productId}-${item.bundleName || "single"}-${item.quantity}`
}

export function CheckoutSuccessSummary({
  items,
  subtotal = 0,
  discount = 0,
  total = 0,
}: CheckoutSuccessSummaryProps) {
  return (
    <section className="mx-auto mt-10 max-w-2xl rounded-[24px] border border-black/8 bg-white p-5 shadow-[0_22px_48px_-38px_rgba(0,0,0,0.25)] sm:p-6">
      <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <h2 className="font-sans text-2xl font-semibold text-neutral-950">Order Summary</h2>
        </div>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-neutral-50 text-neutral-500">
          <Package2 className="h-[18px] w-[18px]" />
        </span>
      </div>

      {items.length > 0 ? (
        <div className="mt-4 divide-y divide-neutral-200">
          {items.map((item) => (
            <div key={createItemKey(item)} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[10px] bg-neutral-100">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-neutral-400">
                    <Package2 className="h-5 w-5" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 text-sm font-medium leading-5 text-neutral-900">
                  {item.name}
                </h3>
                {item.bundleName && (
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                    {item.bundleName}
                  </p>
                )}
                <p className="mt-1 text-[13px] leading-5 text-neutral-500">
                  Qty {item.quantity}
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm font-semibold text-neutral-950">
                  {formatPrice(item.lineTotal)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-[20px] border border-dashed border-neutral-200 bg-neutral-50 px-5 py-8 text-center">
          <p className="text-sm leading-6 text-neutral-600">
            Your order summary will appear here when the checkout details are available in this browser session.
          </p>
        </div>
      )}

      <div className="mt-5 space-y-2.5 border-t border-neutral-200 pt-4 text-sm">
        <div className="flex items-center justify-between text-neutral-600">
          <span>Subtotal</span>
          <span className="font-medium text-neutral-950">{formatPrice(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex items-center justify-between text-emerald-700">
            <span>Promo Discount</span>
            <span>- {formatPrice(discount)}</span>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-neutral-200 pt-4">
          <span className="text-xl font-semibold text-neutral-950">Total</span>
          <span className="text-xl font-semibold text-neutral-950">{formatPrice(total)}</span>
        </div>
      </div>
    </section>
  )
}
