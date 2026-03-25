"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { CheckCircle2 } from "lucide-react"
import { useCart } from "@/contexts/cart-context"

export default function CheckoutSuccessPage() {
  const [orderId, setOrderId] = useState("")
  const { clearCart } = useCart()

  useEffect(() => {
    clearCart()
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    setOrderId(params.get("order_id") || "")
  }, [clearCart])

  return (
    <div className="min-h-[70vh] bg-white px-4 py-16">
      <div className="mx-auto max-w-xl rounded-2xl border border-neutral-200 bg-white p-8 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-green-600" />
        <h1 className="mt-4 font-serif text-3xl text-neutral-900">Payment Successful</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Your order has been received and payment was completed.
        </p>
        {orderId && <p className="mt-2 text-xs text-neutral-500">Order ID: {orderId}</p>}

        <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/profile?section=orders" className="rounded-xl border border-black bg-black px-5 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-white hover:text-black">
            View Orders
          </Link>
          <Link href="/" className="rounded-xl border border-neutral-300 bg-white px-5 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-700 transition hover:border-black hover:text-black">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
