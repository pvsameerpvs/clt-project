"use client"

import Link from "next/link"
import { XCircle } from "lucide-react"

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-[70vh] bg-white px-4 py-16">
      <div className="mx-auto max-w-xl rounded-2xl border border-neutral-200 bg-white p-8 text-center">
        <XCircle className="mx-auto h-14 w-14 text-amber-600" />
        <h1 className="mt-4 font-serif text-3xl text-neutral-900">Payment Cancelled</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Your card payment was cancelled. Your cart is still available.
        </p>

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
