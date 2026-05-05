"use client"

import { AlertCircle, Check, Clock } from "lucide-react"
import type { PaymentMethod } from "../../checkout-types"

type CheckoutSuccessHeroProps = {
  paymentMethod: PaymentMethod | null
  paymentStatus?: "verifying" | "paid" | "pending" | "failed" | "unverified" | null
  orderReference?: string | null
}

function getHeroCopy(paymentMethod: PaymentMethod | null, paymentStatus?: CheckoutSuccessHeroProps["paymentStatus"]) {
  if (paymentMethod === "cod") {
    return {
      title: "Thank you for your order",
      description:
        "We've received your order successfully. Our team will confirm it and prepare dispatch updates for you shortly.",
    }
  }

  if (paymentStatus === "verifying") {
    return {
      title: "Confirming your payment",
      description:
        "We're checking the bank payment status now. Your order will move ahead as soon as Ziina confirms the payment.",
    }
  }

  if (paymentStatus === "pending") {
    return {
      title: "Payment is processing",
      description:
        "Your bank payment is still processing. We'll confirm your order automatically once the payment is complete.",
    }
  }

  if (paymentStatus === "failed") {
    return {
      title: "Payment not completed",
      description:
        "We could not confirm this bank payment. Your cart is still available if you want to try again.",
    }
  }

  if (paymentStatus === "unverified") {
    return {
      title: "Payment not confirmed",
      description:
        "We could not find the Ziina payment reference for this checkout. Your order will stay pending until payment is confirmed.",
    }
  }

  return {
    title: "Thank you for your purchase",
    description:
      "We've received your order and payment successfully. Your fragrance selection is now being prepared for dispatch.",
  }
}

export function CheckoutSuccessHero({
  paymentMethod,
  paymentStatus,
  orderReference,
}: CheckoutSuccessHeroProps) {
  const heroCopy = getHeroCopy(paymentMethod, paymentStatus)
  const isAttentionStatus = paymentStatus === "failed" || paymentStatus === "unverified"
  const isWaitingStatus = paymentStatus === "verifying" || paymentStatus === "pending"
  const StatusIcon = isAttentionStatus ? AlertCircle : isWaitingStatus ? Clock : Check
  const iconClassName = isAttentionStatus
    ? "bg-red-50 text-red-700 ring-1 ring-red-100"
    : isWaitingStatus
      ? "bg-amber-50 text-amber-700 ring-1 ring-amber-100"
      : "bg-black text-white shadow-[0_22px_44px_-20px_rgba(0,0,0,0.45)]"

  return (
    <section className="mx-auto max-w-2xl text-center">
      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-black/6">
        <div className={`flex h-[72px] w-[72px] items-center justify-center rounded-full ${iconClassName}`}>
          <StatusIcon className="h-9 w-9" strokeWidth={2.8} />
        </div>
      </div>

      <h1 className="mt-8 font-sans text-4xl font-semibold leading-tight text-neutral-950 sm:text-5xl">
        {heroCopy.title}
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-neutral-600">
        {heroCopy.description}
      </p>

      {orderReference && (
        <p className="mt-3 text-lg text-neutral-600">
          Your order number is <span className="font-semibold text-neutral-950">#{orderReference}</span>
        </p>
      )}
    </section>
  )
}
