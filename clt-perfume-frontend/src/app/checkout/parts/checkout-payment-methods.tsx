import { CreditCard, Truck } from "lucide-react"
import { PaymentMethod } from "../checkout-types"

interface CheckoutPaymentMethodsProps {
  paymentMethod: PaymentMethod
  setPaymentMethod: (method: PaymentMethod) => void
}

export function CheckoutPaymentMethods({ paymentMethod, setPaymentMethod }: CheckoutPaymentMethodsProps) {
  return (
    <article className="rounded-2xl border border-neutral-100 bg-white p-5 md:p-6 shadow-sm">
      <h2 className="mb-6 font-serif text-xl md:text-2xl text-neutral-900 flex items-center gap-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-[10px] text-white font-sans font-bold">3</span>
        Payment Method
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setPaymentMethod("cod")}
          className={`relative rounded-xl border p-4 text-left transition ${paymentMethod === "cod" ? "border-black bg-neutral-50 ring-1 ring-black" : "border-neutral-200 bg-white hover:border-neutral-300"}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className={`h-4 w-4 ${paymentMethod === "cod" ? "text-black" : "text-neutral-500"}`} />
              <p className={`text-sm font-semibold ${paymentMethod === "cod" ? "text-black" : "text-neutral-800"}`}>Cash On Delivery</p>
            </div>
            {/* Standard Selection Circle */}
            <div className={`flex h-4 w-4 items-center justify-center rounded-full border ${paymentMethod === "cod" ? "border-black bg-black" : "border-neutral-300"}`}>
               {paymentMethod === "cod" && <div className="h-1.5 w-1.5 rounded-full bg-white"></div>}
            </div>
          </div>
          <p className="mt-2 text-xs text-neutral-500">Fast and secure payment at your doorstep.</p>
        </button>
        <button
          type="button"
          disabled={true}
          className="rounded-xl border border-neutral-100 bg-neutral-50 p-4 text-left transition-all opacity-60 grayscale cursor-not-allowed"
        >
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-neutral-400" />
            <p className="text-sm font-semibold text-neutral-500">Bank / Card Payment</p>
          </div>
          <p className="mt-2 text-[11px] font-medium text-amber-600 uppercase tracking-wider">Currently Unavailable</p>
        </button>
      </div>
    </article>
  )
}
