"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import { AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import {
  getBankPaymentOrderStatus,
  getBankPaymentSessionStatus,
  type BankPaymentSessionStatusResponse,
} from "@/lib/api"

type PaymentReturnStatus = "verifying" | "failed" | "cancelled" | "pending" | "paid" | "unverified"

function getInitialStatus(paymentParam: string | null, shouldVerify = false): PaymentReturnStatus {
  if (shouldVerify) return "verifying"
  if (paymentParam === "failed") return "failed"
  return "cancelled"
}

function getInitialDetail(paymentParam: string | null, shouldVerify = false) {
  if (shouldVerify) return ""
  return paymentParam === "failed"
    ? "Payment declined. No amount was captured."
    : "Payment cancelled. No amount was captured."
}

function createOrderReference(orderNumber?: string | null, orderId?: string | null) {
  if (orderNumber) return orderNumber
  if (orderId) return orderId.slice(0, 8).toUpperCase()
  return ""
}

function normalizeSessionId(value: string | null) {
  if (!value || value.includes("{") || value.includes("}")) return null
  return value
}

function getPaymentErrorMessage(session?: BankPaymentSessionStatusResponse | null) {
  return session?.latestError?.message || "The payment was not completed. Please check the card details or try another payment method."
}

function hasDeclinedPayment(session: BankPaymentSessionStatusResponse, paymentParam: string | null) {
  return Boolean(
    session.latestError?.message ||
      paymentParam === "failed" ||
      session.providerStatus === "failed" ||
      session.status === "failed"
  )
}

function getStatusCopy(status: PaymentReturnStatus, detail: string) {
  if (status === "verifying") {
    return {
      title: "Checking Payment",
      description: "We are confirming the latest payment status with Ziina.",
    }
  }

  if (status === "failed") {
    return {
      title: "Payment Declined",
      description: detail || "Your bank or card issuer declined this payment. No amount was captured.",
    }
  }

  if (status === "pending") {
    return {
      title: "Payment Processing",
      description: detail || "Ziina has not confirmed the final payment status yet. Your order will stay pending.",
    }
  }

  if (status === "paid") {
    return {
      title: "Payment Completed",
      description: "Your payment was completed. Taking you to the order confirmation page.",
    }
  }

  if (status === "unverified") {
    return {
      title: "Payment Not Verified",
      description: detail || "We could not verify this payment. Please try again or contact support if money was deducted.",
    }
  }

  return {
    title: "Payment Cancelled",
    description: detail || "Your card payment was cancelled. Your cart is still available.",
  }
}

function CheckoutCancelView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { accessToken, isLoading } = useAuth()
  const toastShownRef = useRef(false)

  const queryOrderId = searchParams.get("order_id")
  const queryOrderNumber = searchParams.get("order_number")
  const queryPayment = searchParams.get("payment")
  const querySessionId = normalizeSessionId(searchParams.get("session_id"))
  const shouldVerifyPayment = Boolean(querySessionId || queryOrderId)
  const [paymentStatus, setPaymentStatus] = useState<PaymentReturnStatus>(() => getInitialStatus(queryPayment, shouldVerifyPayment))
  const [detail, setDetail] = useState(() => getInitialDetail(queryPayment, shouldVerifyPayment))

  const orderReference = createOrderReference(queryOrderNumber, queryOrderId)

  useEffect(() => {
    if (isLoading) return

    toastShownRef.current = false

    if (!querySessionId && !queryOrderId) {
      const message = getInitialDetail(queryPayment)
      if (!toastShownRef.current) {
        toastShownRef.current = true
        toast.error(message)
      }
      return
    }

    let isActive = true

    const statusRequest = querySessionId
      ? getBankPaymentSessionStatus(querySessionId, accessToken, queryOrderId)
      : getBankPaymentOrderStatus(queryOrderId!, accessToken)

    statusRequest
      .then((session) => {
        if (!isActive) return

        if (session.status === "paid" || session.providerStatus === "completed" || session.orderStatus === "paid") {
          setPaymentStatus("paid")
          toast.success("Payment completed successfully")
          const successUrl = `/checkout/success?${new URLSearchParams({
            ...(querySessionId ? { session_id: querySessionId } : {}),
            ...(queryOrderId ? { order_id: queryOrderId } : {}),
            ...(queryOrderNumber ? { order_number: queryOrderNumber } : {}),
            payment: "bank",
          }).toString()}`
          router.replace(successUrl)
          return
        }

        if (hasDeclinedPayment(session, queryPayment)) {
          const message = getPaymentErrorMessage(session)
          setPaymentStatus("failed")
          setDetail(message)
          toast.error(message)
          return
        }

        if (queryPayment === "cancelled" || session.providerStatus === "canceled" || session.status === "canceled") {
          const message = "Payment cancelled. No amount was captured."
          setPaymentStatus("cancelled")
          setDetail(message)
          toast.error(message)
          return
        }

        const message = "Payment is still processing. We will update your order once Ziina confirms it."
        setPaymentStatus("pending")
        setDetail(message)
        toast.message(message)
      })
      .catch((error) => {
        if (!isActive) return
        const message = error instanceof Error ? error.message : "Could not verify payment status"
        setPaymentStatus("unverified")
        setDetail(message)
        if (!toastShownRef.current) {
          toastShownRef.current = true
          toast.error(message)
        }
      })

    return () => {
      isActive = false
    }
  }, [accessToken, isLoading, queryOrderId, queryOrderNumber, queryPayment, querySessionId, router])

  const statusCopy = useMemo(() => getStatusCopy(paymentStatus, detail), [detail, paymentStatus])
  const StatusIcon = paymentStatus === "paid" ? CheckCircle2 : paymentStatus === "pending" || paymentStatus === "verifying" ? Clock : paymentStatus === "failed" || paymentStatus === "unverified" ? AlertCircle : XCircle
  const iconClassName = paymentStatus === "paid"
    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
    : paymentStatus === "pending" || paymentStatus === "verifying"
      ? "bg-amber-50 text-amber-700 ring-1 ring-amber-100"
      : "bg-red-50 text-red-700 ring-1 ring-red-100"

  return (
    <div className="min-h-[70vh] bg-white px-4 py-16">
      <div className="mx-auto max-w-xl rounded-xl border border-neutral-200 bg-white p-8 text-center shadow-[0_24px_70px_-55px_rgba(0,0,0,0.45)]">
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${iconClassName}`}>
          <StatusIcon className="h-8 w-8" strokeWidth={2.4} />
        </div>
        <h1 className="mt-5 font-serif text-3xl text-neutral-900">{statusCopy.title}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-neutral-600">
          {statusCopy.description}
        </p>

        {orderReference && (
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
            Order #{orderReference}
          </p>
        )}

        <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/checkout" className="rounded-xl border border-black bg-black px-5 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-white hover:text-black">
            Return to Checkout
          </Link>
          <Link href="/cart" className="rounded-xl border border-neutral-300 bg-white px-5 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-700 transition hover:border-black hover:text-black">
            Back to Cart
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutCancelPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh]" />}>
      <CheckoutCancelView />
    </Suspense>
  )
}
