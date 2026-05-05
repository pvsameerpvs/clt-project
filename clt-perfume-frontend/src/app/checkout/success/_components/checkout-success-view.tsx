"use client"

import Link from "next/link"
import { useEffect, useSyncExternalStore } from "react"
import { useSearchParams } from "next/navigation"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import type { PaymentMethod } from "../../checkout-types"
import {
  matchesCheckoutSuccessSnapshot,
  readCheckoutSuccessSnapshot,
  subscribeToCheckoutSuccessSnapshot,
} from "../../checkout-success-storage"
import { CheckoutSuccessHero } from "./checkout-success-hero"

function normalizePaymentMethod(value: string | null): PaymentMethod | null {
  if (value === "cod" || value === "bank" || value === "card") return value
  return null
}

function createOrderReference(orderNumber?: string | null, orderId?: string | null) {
  if (orderNumber) return orderNumber
  if (orderId) return orderId.slice(0, 8).toUpperCase()
  return ""
}

function readMatchingCheckoutSuccessSnapshot(orderId?: string | null, orderNumber?: string | null) {
  const storedSnapshot = readCheckoutSuccessSnapshot()
  if (!matchesCheckoutSuccessSnapshot(storedSnapshot, orderId, orderNumber)) {
    return null
  }

  return storedSnapshot
}

export function CheckoutSuccessView() {
  const searchParams = useSearchParams()
  const { clearCart } = useCart()
  const { user } = useAuth()

  const queryOrderId = searchParams.get("order_id")
  const queryOrderNumber = searchParams.get("order_number")
  const queryPaymentMethod = normalizePaymentMethod(searchParams.get("payment"))

  const snapshot = useSyncExternalStore(
    subscribeToCheckoutSuccessSnapshot,
    () => readMatchingCheckoutSuccessSnapshot(queryOrderId, queryOrderNumber),
    () => null
  )

  useEffect(() => {
    void clearCart()
  }, [clearCart])

  const orderReference = createOrderReference(
    queryOrderNumber || snapshot?.orderNumber,
    queryOrderId || snapshot?.orderId
  )

  const paymentMethod = queryPaymentMethod || snapshot?.paymentMethod || null
  const continueShoppingHref = "/"
  const ordersHref = user ? "/profile?section=orders" : null

  return (
    <div className="px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
      <div className="mx-auto max-w-3xl">
        <CheckoutSuccessHero paymentMethod={paymentMethod} orderReference={orderReference} />

        <div className="mt-8 flex flex-col items-center gap-3">
          <Link
            href={continueShoppingHref}
            className="inline-flex min-h-11 items-center justify-center rounded-[14px] border border-black bg-white px-7 py-3 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
          >
            Back to Home
          </Link>

          {ordersHref && (
            <Link
              href={ordersHref}
              className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500 transition hover:text-black"
            >
              View My Orders
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
