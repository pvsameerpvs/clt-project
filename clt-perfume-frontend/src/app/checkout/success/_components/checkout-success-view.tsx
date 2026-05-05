"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, useSyncExternalStore } from "react"
import { useSearchParams } from "next/navigation"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { getBankPaymentSessionStatus } from "@/lib/api"
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
  const { user, accessToken } = useAuth()
  const [bankPaymentStatus, setBankPaymentStatus] = useState<"verifying" | "paid" | "pending" | "failed" | "unverified" | null>(null)

  const queryOrderId = searchParams.get("order_id")
  const queryOrderNumber = searchParams.get("order_number")
  const queryPaymentMethod = normalizePaymentMethod(searchParams.get("payment"))
  const querySessionId = searchParams.get("session_id")

  const snapshot = useSyncExternalStore(
    subscribeToCheckoutSuccessSnapshot,
    () => readMatchingCheckoutSuccessSnapshot(queryOrderId, queryOrderNumber),
    () => null
  )

  const orderReference = createOrderReference(
    queryOrderNumber || snapshot?.orderNumber,
    queryOrderId || snapshot?.orderId
  )

  const paymentMethod = queryPaymentMethod || snapshot?.paymentMethod || null
  const isBankPayment = paymentMethod === "bank" || paymentMethod === "card"
  const shouldVerifyBankPayment = useMemo(
    () => Boolean(querySessionId && (isBankPayment || !paymentMethod)),
    [isBankPayment, paymentMethod, querySessionId]
  )

  useEffect(() => {
    if (paymentMethod !== "cod") return
    void clearCart()
  }, [clearCart, paymentMethod])

  useEffect(() => {
    if (!shouldVerifyBankPayment || !querySessionId) return

    let isActive = true

    getBankPaymentSessionStatus(querySessionId, accessToken, queryOrderId)
      .then((session) => {
        if (!isActive) return

        if (session.status === "paid" || session.providerStatus === "completed" || session.orderStatus === "paid") {
          setBankPaymentStatus("paid")
          void clearCart()
          return
        }

        if (session.providerStatus === "failed" || session.providerStatus === "canceled") {
          setBankPaymentStatus("failed")
          return
        }

        setBankPaymentStatus("pending")
      })
      .catch(() => {
        if (isActive) setBankPaymentStatus("pending")
      })

    return () => {
      isActive = false
    }
  }, [accessToken, clearCart, queryOrderId, querySessionId, shouldVerifyBankPayment])

  const heroPaymentStatus = isBankPayment
    ? querySessionId
      ? bankPaymentStatus || "verifying"
      : "unverified"
    : shouldVerifyBankPayment
      ? bankPaymentStatus || "verifying"
      : null
  const continueShoppingHref = "/"
  const ordersHref = user ? "/profile?section=orders" : null

  return (
    <div className="px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
      <div className="mx-auto max-w-3xl">
        <CheckoutSuccessHero paymentMethod={paymentMethod} paymentStatus={heroPaymentStatus} orderReference={orderReference} />

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
