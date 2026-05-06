import { Banknote, CreditCard, RefreshCcw, ShieldCheck } from "lucide-react"
import type { OrderRecord } from "./profile-types"
import { getOrderPaymentDisplay, isCashOnDeliveryPayment, type OrderPaymentTone } from "./profile-utils"
import { cn } from "@/lib/utils"

const paymentToneClass: Record<OrderPaymentTone, string> = {
  paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
  unpaid: "border-amber-200 bg-amber-50 text-amber-700",
  cod: "border-violet-200 bg-violet-50 text-violet-700",
  refunded: "border-red-200 bg-red-50 text-red-700",
}

export function OrderPaymentBadge({
  order,
  className,
}: {
  order: Pick<OrderRecord, "status" | "payment_method">
  className?: string
}) {
  const payment = getOrderPaymentDisplay(order)
  const isCOD = isCashOnDeliveryPayment(order.payment_method)

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-tight",
        paymentToneClass[payment.tone],
        className
      )}
      title={payment.description}
    >
      {payment.tone === "paid" ? (
        <ShieldCheck className="h-3 w-3 shrink-0" />
      ) : payment.tone === "refunded" ? (
        <RefreshCcw className="h-3 w-3 shrink-0" />
      ) : isCOD ? (
        <Banknote className="h-3 w-3 shrink-0" />
      ) : (
        <CreditCard className="h-3 w-3 shrink-0" />
      )}
      {payment.label}
    </span>
  )
}
