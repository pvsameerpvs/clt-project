import Link from "next/link"
import type { OrderRecord } from "./profile-types"
import { canCancelOrder, canRequestReturn, normalizeOrderStatus } from "./profile-utils"
import { OrderStatusStepper } from "./order-status-stepper"
import { cn } from "@/lib/utils"

type ProfileOrdersSectionProps = {
  ordersLoading: boolean
  orders: OrderRecord[]
  orderActionLoadingId: string | null
  returnReasonByOrder: Record<string, string>
  onReturnReasonChange: (orderId: string, reason: string) => void
  onCancelOrder: (orderId: string) => void
  onRequestReturn: (orderId: string) => void
  getReturnRequestStatus: (orderId: string) => string | null
}

export function ProfileOrdersSection({
  ordersLoading,
  orders,
  orderActionLoadingId,
  returnReasonByOrder,
  onReturnReasonChange,
  onCancelOrder,
  onRequestReturn,
  getReturnRequestStatus,
}: ProfileOrdersSectionProps) {
  function toMoney(value: number | string | null | undefined) {
    return Number(value || 0).toFixed(2)
  }

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-serif text-2xl text-neutral-900">Order History</h2>
        <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">
          {ordersLoading ? "Loading..." : `${orders.length} total orders`}
        </p>
      </div>
      {ordersLoading ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-neutral-600">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-neutral-600">No orders found yet.</div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const orderItems = Array.isArray(order.items) ? order.items : []

            return (
              <article key={order.id} className="rounded-2xl border border-neutral-200 bg-white p-4 md:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-neutral-900">
                    Order #{order.order_number || order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className={cn(
                    "text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border",
                    normalizeOrderStatus(order.status) === 'refunded' 
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-100" 
                      : "border-neutral-200 bg-neutral-50 text-neutral-500"
                  )}>
                    {normalizeOrderStatus(order.status) || "pending"}
                  </p>
                </div>
                <div className="mt-2 flex flex-wrap gap-5 text-sm text-neutral-600 items-center">
                  <p>Date: {new Date(order.created_at).toLocaleDateString("en-GB")}</p>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-neutral-900">Total: AED {toMoney(order.total)}</p>
                    {normalizeOrderStatus(order.status) === 'refunded' && (
                      <span className="text-[10px] font-medium text-emerald-600 italic bg-emerald-50/50 px-2 py-0.5 rounded">
                        (Refunded to original method)
                      </span>
                    )}
                  </div>
                  {(order.shipping_address?.city || order.shipping_address?.country) && (
                    <p>
                      Delivery: {order.shipping_address?.city || ""}
                      {order.shipping_address?.country ? `, ${order.shipping_address.country}` : ""}
                    </p>
                  )}
                </div>

                <OrderStatusStepper status={order.status} />

                <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Products</p>
                    <p className="text-xs text-neutral-500">{orderItems.length} item(s)</p>
                  </div>

                  {orderItems.length === 0 ? (
                    <p className="text-sm text-neutral-500">Product details are not available for this order.</p>
                  ) : (
                    <div className="space-y-2">
                      {orderItems.map((item) => {
                        const quantity = Math.max(1, Number(item.quantity || 1))
                        const unitPrice = Number(item.price || 0)
                        const lineTotal = unitPrice * quantity
                        const productName = item.product_name || "Product"
                        const hasSlug = Boolean(item.product_slug)

                        return (
                          <div key={item.id} className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-2.5">
                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-white">
                              {item.product_image ? (
                                <img
                                  src={item.product_image}
                                  alt={productName}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-wide text-neutral-400">
                                  No Image
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1">
                                {hasSlug ? (
                                  <Link
                                    href={`/product/${item.product_slug}`}
                                    className="block truncate text-sm font-semibold text-neutral-900 transition hover:underline"
                                    title={productName}
                                  >
                                    {productName}
                                  </Link>
                                ) : (
                                  <p className="truncate text-sm font-semibold text-neutral-900" title={productName}>
                                    {productName}
                                  </p>
                                )}
                                {unitPrice === 0 && (
                                  <span className="ml-2 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-emerald-600 border border-emerald-100">
                                    Free Gift
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-neutral-500">
                                {unitPrice === 0 ? (
                                  `Qty ${quantity} x Free`
                                ) : (
                                  `Qty ${quantity} x AED ${toMoney(unitPrice)}`
                                )}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-neutral-800">
                              {unitPrice === 0 ? (
                                <span className="text-emerald-600 font-bold tracking-tight">FREE</span>
                              ) : (
                                `AED ${toMoney(lineTotal)}`
                              )}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {canCancelOrder(order.status) && (
                    <button
                      type="button"
                      onClick={() => onCancelOrder(order.id)}
                      disabled={orderActionLoadingId === order.id}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-red-700 transition hover:border-red-300 disabled:opacity-60"
                    >
                      {orderActionLoadingId === order.id ? "Cancelling..." : "Cancel Order"}
                    </button>
                  )}
                  {canRequestReturn(order.status, order.delivered_at) && !getReturnRequestStatus(order.id) && (
                    <button
                      type="button"
                      onClick={() => onRequestReturn(order.id)}
                      disabled={orderActionLoadingId === order.id}
                      className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-neutral-700 transition hover:border-black hover:text-black disabled:opacity-60"
                    >
                      {orderActionLoadingId === order.id ? "Submitting..." : "Request Return"}
                    </button>
                  )}
                  {getReturnRequestStatus(order.id) === 'pending' && (
                    <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-amber-700">
                      Return Requested
                    </span>
                  )}
                  {getReturnRequestStatus(order.id) === 'approved' && (
                    <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">
                      Return Approved
                    </span>
                  )}
                  {getReturnRequestStatus(order.id) === 'rejected' && (
                    <div className="flex flex-col gap-1">
                      <span className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-red-700 w-fit">
                        Return Rejected
                      </span>
                      <p className="text-[10px] text-neutral-500 italic ml-1">Check email for more info</p>
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
