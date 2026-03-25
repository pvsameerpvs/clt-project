import { ORDER_STEPS } from "./profile-types"
import { normalizeOrderStatus } from "./profile-utils"

export function OrderStatusStepper({ status }: { status?: string | null }) {
  const normalizedStatus = normalizeOrderStatus(status)
  const activeIndex = Math.max(0, ORDER_STEPS.indexOf(normalizedStatus as (typeof ORDER_STEPS)[number]))

  return (
    <div className="mt-4">
      <div className="relative px-1">
        <div className="absolute left-[10px] right-[10px] top-[10px] h-px bg-neutral-200" />
        <div
          className="absolute left-[10px] top-[10px] h-px bg-black transition-all duration-500"
          style={{ width: `calc((100% - 20px) * ${activeIndex} / ${ORDER_STEPS.length - 1})` }}
        />
        <div className="relative flex justify-between">
          {ORDER_STEPS.map((step, index) => {
            const completed = index <= activeIndex
            const current = index === activeIndex
            return (
              <div key={step} className="flex w-14 flex-col items-center gap-2">
                <span
                  className={`h-5 w-5 rounded-full border bg-white transition ${
                    completed ? "border-black" : "border-neutral-300"
                  } ${current ? "ring-4 ring-black/5" : ""}`}
                >
                  <span className={`m-auto mt-[5px] block h-2 w-2 rounded-full ${completed ? "bg-black" : "bg-transparent"}`} />
                </span>
                <span
                  className={`text-[9px] uppercase tracking-[0.12em] ${
                    current ? "font-semibold text-black" : completed ? "text-neutral-600" : "text-neutral-400"
                  }`}
                >
                  {step}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
