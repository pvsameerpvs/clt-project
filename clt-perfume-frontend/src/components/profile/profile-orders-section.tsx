"use client"

import { useState } from "react"
import type { ComponentType, ReactNode } from "react"
import Link from "next/link"
import Image from "next/image"
import { CalendarDays, ChevronRight, CreditCard, MapPin, PackageCheck, ReceiptText } from "lucide-react"
import type { OrderRecord } from "./profile-types"
import { canCancelOrder, canRequestReturn, getOrderPaymentDisplay, normalizeOrderStatus, toDisplayDate } from "./profile-utils"
import { OrderStatusStepper } from "./order-status-stepper"
import { OrderPaymentBadge } from "./order-payment-badge"
import { cn } from "@/lib/utils"

type OrderItemRecord = NonNullable<OrderRecord["items"]>[number]

type ProfileOrdersSectionProps = {
  ordersLoading: boolean
  orders: OrderRecord[]
  orderActionLoadingId: string | null
  onCancelOrder: (orderId: string) => void
  onRequestReturn: (orderId: string) => void
  getReturnRequestStatus: (orderId: string) => string | null
}

function toMoney(value: number | string | null | undefined) {
  return Number(value || 0).toFixed(2)
}

function toStatusLabel(status?: string | null) {
  const normalized = normalizeOrderStatus(status) || "pending"
  return normalized.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
}

function getOrderNumber(order: OrderRecord) {
  return order.order_number || order.id.slice(0, 8).toUpperCase()
}

function getOrderItems(order: OrderRecord) {
  return Array.isArray(order.items) ? order.items : []
}

function getShippingLabel(order: OrderRecord) {
  const parts = [order.shipping_address?.city, order.shipping_address?.country].filter(Boolean)
  return parts.length ? parts.join(", ") : "Delivery address not available"
}

function getStatusBadgeClass(status?: string | null) {
  const normalized = normalizeOrderStatus(status)

  if (normalized === "delivered" || normalized === "refunded") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }

  if (normalized === "cancelled" || normalized === "canceled" || normalized === "returned") {
    return "border-red-200 bg-red-50 text-red-700"
  }

  if (normalized === "shipped" || normalized === "processing") {
    return "border-blue-200 bg-blue-50 text-blue-700"
  }

  return "border-neutral-200 bg-neutral-50 text-neutral-600"
}

function getItemDisplay(item: OrderItemRecord) {
  const quantity = Math.max(1, Number(item.quantity || 1))
  const unitPrice = Number(item.price || 0)
  const lineTotal = unitPrice * quantity
  const rawName = item.product_name || "Product"
  const productName = rawName
    .replace(/\(Offer:.*?:AED\s*[\d.]+\)/, "")
    .replace(/\(Offer:AED\s*[\d.]+\)/, "")
    .replace("(Offer)", "")
    .trim()

  const bundleMatch = rawName.match(/\(Offer:(.*?):AED\s*[\d.]+\)/)
  const bundleTitle = bundleMatch ? bundleMatch[1] : rawName.includes("(Offer") ? "Special Offer" : null
  const priceMatch = rawName.match(/AED\s*([\d.]+)\)/)
  const originalPrice = priceMatch ? Number(priceMatch[1]) : null

  return {
    bundleTitle,
    isOffer: Boolean(bundleTitle),
    lineTotal,
    originalPrice,
    productName,
    quantity,
    unitPrice,
  }
}

export function ProfileOrdersSection({
  ordersLoading,
  orders,
  orderActionLoadingId,
  onCancelOrder,
  onRequestReturn,
  getReturnRequestStatus,
}: ProfileOrdersSectionProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const selectedOrder = orders.find((order) => order.id === selectedOrderId) || orders[0]

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">My Orders</p>
          <h2 className="mt-1 font-serif text-3xl text-neutral-900 md:text-4xl">Order History</h2>
        </div>
        <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">
          {ordersLoading ? "Loading..." : `${orders.length} total orders`}
        </p>
      </div>

      {ordersLoading ? (
        <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
          <div className="rounded-[28px] border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="h-5 w-32 animate-pulse rounded-full bg-neutral-100" />
            <div className="mt-4 space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-24 animate-pulse rounded-2xl bg-neutral-100" />
              ))}
            </div>
          </div>
          <div className="min-h-[420px] rounded-[28px] border border-neutral-200 bg-neutral-50 p-5">
            <div className="h-full min-h-[360px] animate-pulse rounded-[22px] bg-white" />
          </div>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-neutral-200 bg-neutral-50 p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-neutral-500 shadow-sm">
            <PackageCheck className="h-6 w-6" />
          </div>
          <h3 className="mt-5 font-serif text-2xl text-neutral-900">No orders yet</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-neutral-500">
            Once you place an order, it will appear here with tracking, products, and available actions.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
          <div className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm">
            <div className="border-b border-neutral-100 bg-neutral-50/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Order List</p>
                  <p className="mt-1 text-sm text-neutral-500">Select an order to view tracking and products.</p>
                </div>
                <ReceiptText className="h-5 w-5 text-neutral-400" />
              </div>
            </div>
            <div className="max-h-[440px] space-y-2 overflow-y-auto p-3 xl:max-h-[720px]">
              {orders.map((order) => {
                const isSelected = order.id === selectedOrder?.id
                const itemCount = getOrderItems(order).length

                return (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => setSelectedOrderId(order.id)}
                    aria-pressed={isSelected}
                    className={cn(
                      "group relative w-full overflow-hidden rounded-2xl border p-4 text-left transition duration-200",
                      isSelected
                        ? "border-black bg-white text-neutral-900 shadow-[0_18px_36px_-30px_rgba(0,0,0,0.65)] ring-1 ring-black/5 before:absolute before:inset-y-4 before:left-0 before:w-1 before:rounded-r-full before:bg-black"
                        : "border-neutral-200 bg-white text-neutral-900 hover:border-neutral-300 hover:bg-neutral-50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-neutral-900">
                          Order #{getOrderNumber(order)}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                          {toDisplayDate(order.created_at)} | {itemCount} item{itemCount === 1 ? "" : "s"}
                        </p>
                      </div>
                      <ChevronRight
                        className={cn(
                          "mt-0.5 h-4 w-4 shrink-0 transition",
                          isSelected ? "translate-x-0.5 text-neutral-900" : "text-neutral-300 group-hover:translate-x-0.5 group-hover:text-neutral-500"
                        )}
                      />
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]",
                            getStatusBadgeClass(order.status)
                          )}
                        >
                          {toStatusLabel(order.status)}
                        </span>
                        <OrderPaymentBadge order={order} />
                      </div>
                      <span className="text-sm font-semibold text-neutral-900">
                        AED {toMoney(order.total)}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <OrderDetailCard
            order={selectedOrder}
            orderActionLoadingId={orderActionLoadingId}
            onCancelOrder={onCancelOrder}
            onRequestReturn={onRequestReturn}
            getReturnRequestStatus={getReturnRequestStatus}
          />
        </div>
      )}
    </section>
  )
}

function OrderDetailCard({
  order,
  orderActionLoadingId,
  onCancelOrder,
  onRequestReturn,
  getReturnRequestStatus,
}: {
  order: OrderRecord
  orderActionLoadingId: string | null
  onCancelOrder: (orderId: string) => void
  onRequestReturn: (orderId: string) => void
  getReturnRequestStatus: (orderId: string) => string | null
}) {
  const orderItems = getOrderItems(order)
  const returnRequestStatus = getReturnRequestStatus(order.id)
  const normalizedStatus = normalizeOrderStatus(order.status)
  const paymentDisplay = getOrderPaymentDisplay(order)
  const canCancel = canCancelOrder(order.status)
  const canReturn = canRequestReturn(order.status, order.delivered_at) && !returnRequestStatus

  return (
    <article className="min-w-0 rounded-[28px] border border-neutral-200 bg-white p-4 shadow-sm md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">Selected Order</p>
          <h3 className="mt-1 font-serif text-2xl text-neutral-900 md:text-3xl">Order #{getOrderNumber(order)}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
            View the order journey, delivery location, products, and available order actions.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className={cn("rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em]", getStatusBadgeClass(order.status))}>
            {toStatusLabel(order.status)}
          </span>
          <OrderPaymentBadge order={order} className="px-3 py-1.5 tracking-[0.16em]" />
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryTile icon={CalendarDays} label="Date" value={toDisplayDate(order.created_at)} />
        <SummaryTile
          icon={PackageCheck}
          label="Total"
          value={
            <span>
              AED {toMoney(order.total)}
              {normalizedStatus === "refunded" ? (
                <span className="ml-2 align-middle text-[10px] font-medium text-emerald-600">Refunded</span>
              ) : null}
            </span>
          }
          strong
        />
        <SummaryTile
          icon={CreditCard}
          label="Payment"
          value={
            <span className="flex flex-col gap-1">
              <OrderPaymentBadge order={order} className="w-fit" />
              <span className="text-xs font-normal leading-5 text-neutral-500">{paymentDisplay.description}</span>
            </span>
          }
        />
        <SummaryTile icon={MapPin} label="Delivery" value={getShippingLabel(order)} />
      </div>

      <OrderStatusStepper status={order.status} createdAt={order.created_at} deliveredAt={order.delivered_at} />

      <div className="mt-5 rounded-[24px] border border-neutral-200 bg-neutral-50/80 p-4 md:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Products</p>
            <p className="mt-1 text-sm text-neutral-500">Items included in this order.</p>
          </div>
          <p className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-500">
            {orderItems.length} item{orderItems.length === 1 ? "" : "s"}
          </p>
        </div>

        {orderItems.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-200 bg-white p-4 text-sm text-neutral-500">
            Product details are not available for this order.
          </p>
        ) : (
          <div className="space-y-3">
            {orderItems.map((item) => (
              <OrderProductRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {(canCancel || canReturn || returnRequestStatus) && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {canCancel && (
            <button
              type="button"
              onClick={() => onCancelOrder(order.id)}
              disabled={orderActionLoadingId === order.id}
              className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:opacity-60"
            >
              {orderActionLoadingId === order.id ? "Cancelling..." : "Cancel Order"}
            </button>
          )}
          {canReturn && (
            <button
              type="button"
              onClick={() => onRequestReturn(order.id)}
              disabled={orderActionLoadingId === order.id}
              className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-neutral-700 transition hover:border-black hover:text-black disabled:opacity-60"
            >
              {orderActionLoadingId === order.id ? "Submitting..." : "Request Return"}
            </button>
          )}
          {returnRequestStatus === "pending" && <ReturnStatusBadge tone="amber">Return Requested</ReturnStatusBadge>}
          {returnRequestStatus === "approved" && <ReturnStatusBadge tone="emerald">Return Approved</ReturnStatusBadge>}
          {returnRequestStatus === "rejected" && (
            <div className="flex flex-col gap-1">
              <ReturnStatusBadge tone="red">Return Rejected</ReturnStatusBadge>
              <p className="ml-1 text-[10px] italic text-neutral-500">Check email for more info</p>
            </div>
          )}
        </div>
      )}
    </article>
  )
}

function SummaryTile({
  icon: Icon,
  label,
  value,
  strong,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: ReactNode
  strong?: boolean
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
      <div className="flex items-center gap-2 text-neutral-400">
        <Icon className="h-4 w-4" />
        <p className="text-[10px] font-bold uppercase tracking-[0.16em]">{label}</p>
      </div>
      <p className={cn("mt-2 text-sm leading-6 text-neutral-700", strong ? "font-semibold text-neutral-950" : "")}>{value}</p>
    </div>
  )
}

function OrderProductRow({ item }: { item: OrderItemRecord }) {
  const { bundleTitle, isOffer, lineTotal, originalPrice, productName, quantity, unitPrice } = getItemDisplay(item)
  const hasSlug = Boolean(item.product_slug)

  return (
    <div className="flex gap-3 rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm md:items-center md:p-4">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 md:h-20 md:w-20">
        {item.product_image ? (
          <Image
            src={item.product_image}
            alt={productName}
            width={80}
            height={80}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-wide text-neutral-400">
            No Image
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {hasSlug ? (
            <Link
              href={`/product/${item.product_slug}`}
              className="max-w-full truncate text-sm font-semibold text-neutral-900 transition hover:text-neutral-600 hover:underline md:text-base"
              title={productName}
            >
              {productName}
            </Link>
          ) : (
            <p className="max-w-full truncate text-sm font-semibold text-neutral-900 md:text-base" title={productName}>
              {productName}
            </p>
          )}
          {unitPrice === 0 && (
            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-emerald-600">
              Free Gift
            </span>
          )}
          {isOffer && (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-amber-700">
              {bundleTitle}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs leading-5 text-neutral-500">
          {unitPrice === 0 ? (
            `Qty ${quantity} x Free`
          ) : (
            <>
              {originalPrice ? <span className="mr-2 text-neutral-400 line-through">AED {toMoney(originalPrice)}</span> : null}
              <span>Qty {quantity} x AED {toMoney(unitPrice)}</span>
            </>
          )}
        </p>
      </div>

      <p className="shrink-0 self-center text-right text-sm font-semibold text-neutral-900 md:text-base">
        {unitPrice === 0 ? <span className="text-emerald-600">FREE</span> : `AED ${toMoney(lineTotal)}`}
      </p>
    </div>
  )
}

function ReturnStatusBadge({ tone, children }: { tone: "amber" | "emerald" | "red"; children: ReactNode }) {
  const toneClass = {
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    red: "border-red-200 bg-red-50 text-red-700",
  }[tone]

  return (
    <span className={cn("rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em]", toneClass)}>
      {children}
    </span>
  )
}
