import { ORDER_STEPS } from "./profile-types"
import { normalizeOrderStatus, toDisplayDate } from "./profile-utils"
import { cn } from "@/lib/utils"

type OrderStatusStepperProps = {
  status?: string | null
  createdAt?: string | null
  deliveredAt?: string | null
}

const STEP_COPY: Record<(typeof ORDER_STEPS)[number], string> = {
  pending: "We have received your order.",
  confirmed: "Payment and order details are being confirmed.",
  processing: "Your perfumes are being prepared.",
  shipped: "Your package is on the way.",
  delivered: "Delivered to your address.",
}

function toLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
}

function getStatusTone(status: string) {
  if (status === "delivered" || status === "refunded") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }
  if (status === "cancelled" || status === "canceled" || status === "returned") {
    return "border-red-200 bg-red-50 text-red-700"
  }
  return "border-neutral-200 bg-white text-neutral-700"
}

export function OrderStatusStepper({ status, createdAt, deliveredAt }: OrderStatusStepperProps) {
  const normalizedStatus = normalizeOrderStatus(status)
  const stepIndex = ORDER_STEPS.indexOf(normalizedStatus as (typeof ORDER_STEPS)[number])
  const activeIndex = Math.max(0, stepIndex)
  const statusLabel = normalizedStatus ? toLabel(normalizedStatus) : "Pending"

  return (
    <div className="mt-5 rounded-[24px] border border-neutral-200 bg-neutral-50/80 p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Order Journey</p>
          <p className="mt-1 text-sm text-neutral-500">Track each stage from placement to delivery.</p>
        </div>
        <span className={cn("rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em]", getStatusTone(normalizedStatus))}>
          {statusLabel}
        </span>
      </div>

      <ol className="mt-5 space-y-4 md:grid md:grid-cols-5 md:space-y-0">
        {ORDER_STEPS.map((step, index) => {
          const completed = index <= activeIndex && stepIndex >= 0
          const connectorCompleted = index < activeIndex && stepIndex >= 0
          const current = index === activeIndex && stepIndex >= 0
          const isLast = index === ORDER_STEPS.length - 1
          const date =
            step === "pending"
              ? toDisplayDate(createdAt)
              : step === "delivered"
                ? toDisplayDate(deliveredAt)
                : ""

          return (
            <li key={step} className="relative md:px-2">
              {!isLast && (
                <span
                  className={cn(
                    "absolute left-[13px] top-7 h-[calc(100%+1rem)] w-px md:left-1/2 md:top-[13px] md:h-px md:w-full",
                    connectorCompleted ? "bg-black" : "bg-neutral-200"
                  )}
                />
              )}
              <div className="relative flex gap-3 md:flex-col md:items-center md:text-center">
                <span
                  className={cn(
                    "z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-white transition",
                    completed ? "border-black text-black shadow-sm" : "border-neutral-300 text-neutral-300",
                    current ? "ring-4 ring-black/5" : ""
                  )}
                >
                  <span className={cn("h-2.5 w-2.5 rounded-full", completed ? "bg-black" : "bg-neutral-200")} />
                </span>
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block text-[11px] font-bold uppercase tracking-[0.14em]",
                      current ? "text-black" : completed ? "text-neutral-700" : "text-neutral-400"
                    )}
                  >
                    {step}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-neutral-500 md:px-1">{STEP_COPY[step]}</span>
                  {date ? <span className="mt-1 block text-[11px] font-medium text-neutral-400">{date}</span> : null}
                </span>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
