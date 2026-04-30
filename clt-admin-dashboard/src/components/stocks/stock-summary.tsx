import type { AdminProduct } from "@/lib/admin-api"
import { getStockQuantity, getStockStatus } from "@/components/stocks/stock-utils"
import { Boxes, PackageCheck, PackageMinus, PackageX, Power } from "lucide-react"

interface StockSummaryProps {
  products: AdminProduct[]
}

export function StockSummary({ products }: StockSummaryProps) {
  const totalUnits = products.reduce((sum, p) => sum + getStockQuantity(p), 0)
  const readyCount = products.filter((p) => getStockStatus(p) === "ready").length
  const lowCount = products.filter((p) => getStockStatus(p) === "low").length
  const outCount = products.filter((p) => getStockStatus(p) === "out").length
  const inactiveCount = products.filter((p) => getStockStatus(p) === "inactive").length

  const cards = [
    {
      label: "Total SKUs",
      value: products.length.toLocaleString(),
      sub: "Active products",
      icon: Boxes,
      color: "bg-neutral-50 border-neutral-200",
      iconColor: "text-neutral-500",
      valueColor: "text-neutral-900",
    },
    {
      label: "Total Units",
      value: totalUnits.toLocaleString(),
      sub: "Units in inventory",
      icon: Boxes,
      color: "bg-neutral-50 border-neutral-200",
      iconColor: "text-neutral-500",
      valueColor: "text-neutral-900",
    },
    {
      label: "Ready",
      value: readyCount.toLocaleString(),
      sub: "Well stocked",
      icon: PackageCheck,
      color: "bg-emerald-50 border-emerald-100",
      iconColor: "text-emerald-600",
      valueColor: "text-emerald-700",
    },
    {
      label: "Low Stock",
      value: lowCount.toLocaleString(),
      sub: "Needs attention",
      icon: PackageMinus,
      color: "bg-amber-50 border-amber-100",
      iconColor: "text-amber-600",
      valueColor: "text-amber-700",
    },
    {
      label: "Out of Stock",
      value: outCount.toLocaleString(),
      sub: "Restock urgently",
      icon: PackageX,
      color: outCount > 0 ? "bg-red-50 border-red-100" : "bg-neutral-50 border-neutral-200",
      iconColor: outCount > 0 ? "text-red-600" : "text-neutral-400",
      valueColor: outCount > 0 ? "text-red-700" : "text-neutral-500",
    },
    {
      label: "Inactive",
      value: inactiveCount.toLocaleString(),
      sub: "Not shown in store",
      icon: Power,
      color: "bg-neutral-50 border-neutral-200",
      iconColor: "text-neutral-400",
      valueColor: "text-neutral-500",
    },
  ]

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <article
          key={card.label}
          className={`relative overflow-hidden rounded-2xl border p-4 shadow-sm transition hover:shadow-md ${card.color}`}
        >
          <div className="flex items-start justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">{card.label}</p>
            <card.icon className={`h-4 w-4 shrink-0 ${card.iconColor}`} />
          </div>
          <p className={`mt-3 font-serif text-3xl font-semibold ${card.valueColor}`}>{card.value}</p>
          <p className="mt-1 text-[10px] text-neutral-400">{card.sub}</p>
        </article>
      ))}
    </section>
  )
}
