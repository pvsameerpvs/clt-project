import { CreditCard, Truck } from "lucide-react"
import { PaymentMethod } from "../checkout-types"

interface CheckoutPaymentMethodsProps {
  paymentMethod: PaymentMethod
  setPaymentMethod: (method: PaymentMethod) => void
}

export function CheckoutPaymentMethods({ paymentMethod, setPaymentMethod }: CheckoutPaymentMethodsProps) {
  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-5 md:p-6">
      <h2 className="mb-4 font-serif text-2xl text-neutral-900">3. Payment Method</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setPaymentMethod("cod")}
          className={`rounded-xl border p-4 text-left transition ${paymentMethod === "cod" ? "border-black bg-neutral-50" : "border-neutral-200 bg-white hover:border-neutral-300"}`}
        >
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            <p className="text-sm font-semibold">Cash On Delivery</p>
          </div>
          <p className="mt-2 text-xs text-neutral-500">Pay when your order arrives.</p>
        </button>
        <button
          type="button"
          onClick={() => setPaymentMethod("bank")}
          className={`rounded-xl border p-4 text-left transition ${paymentMethod === "bank" ? "border-black bg-neutral-50" : "border-neutral-200 bg-white hover:border-neutral-300"}`}
        >
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <p className="text-sm font-semibold">Bank / Card Payment</p>
          </div>
          <p className="mt-2 text-xs text-neutral-500">Secure card checkout powered by Stripe.</p>
        </button>
      </div>
    </article>
  )
}
