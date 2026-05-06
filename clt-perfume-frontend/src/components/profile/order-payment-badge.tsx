import type { OrderRecord } from "./profile-types"
import { getOrderPaymentDisplay, type OrderPaymentTone } from "./profile-utils"
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

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]",
        paymentToneClass[payment.tone],
        className
      )}
      title={payment.description}
    >
      {payment.label}
    </span>
  )
}
