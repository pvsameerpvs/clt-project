import { Suspense } from "react"
import { CheckoutSuccessView } from "./_components/checkout-success-view"

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <CheckoutSuccessView />
    </Suspense>
  )
}
