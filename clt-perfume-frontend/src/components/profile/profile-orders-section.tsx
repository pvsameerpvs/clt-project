import Link from "next/link"
import type { OrderRecord } from "./profile-types"
import { canCancelOrder, canRequestReturn, normalizeOrderStatus } from "./profile-utils"
import { OrderStatusStepper } from "./order-status-stepper"

type ProfileOrdersSectionProps = {
  ordersLoading: boolean
  orders: OrderRecord[]
  orderActionLoadingId: string | null
  returnReasonByOrder: Record<string, string>
  onReturnReasonChange: (orderId: string, reason: string) => void
  onCancelOrder: (orderId: string) => void
  onRequestReturn: (orderId: string) => void
  hasOpenReturnRequest: (orderId: string) => boolean
}

export function ProfileOrdersSection({
  ordersLoading,
  orders,
  orderActionLoadingId,
  returnReasonByOrder,
  onReturnReasonChange,
  onCancelOrder,
  onRequestReturn,
  hasOpenReturnRequest,
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
                  <p className="text-xs uppercase tracking-wide text-neutral-500">{normalizeOrderStatus(order.status) || "pending"}</p>
                </div>
                <div className="mt-2 flex flex-wrap gap-5 text-sm text-neutral-600">
                  <p>Date: {new Date(order.created_at).toLocaleDateString("en-GB")}</p>
                  <p>Total: AED {toMoney(order.total)}</p>
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
                              <p className="text-xs text-neutral-500">
                                Qty {quantity} x AED {toMoney(unitPrice)}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-neutral-800">AED {toMoney(lineTotal)}</p>
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
                  {canRequestReturn(order.status) && !hasOpenReturnRequest(order.id) && (
                    <button
                      type="button"
                      onClick={() => onRequestReturn(order.id)}
                      disabled={orderActionLoadingId === order.id}
                      className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-neutral-700 transition hover:border-black hover:text-black disabled:opacity-60"
                    >
                      {orderActionLoadingId === order.id ? "Submitting..." : "Request Return"}
                    </button>
                  )}
                  {canRequestReturn(order.status) && hasOpenReturnRequest(order.id) && (
                    <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-amber-700">
                      Return Requested
                    </span>
                  )}
                </div>
                {canRequestReturn(order.status) && !hasOpenReturnRequest(order.id) && (
                  <div className="mt-2">
                    <input
                      value={returnReasonByOrder[order.id] || ""}
                      onChange={(event) => onReturnReasonChange(order.id, event.target.value)}
                      placeholder="Return reason (optional)"
                      className="h-10 w-full rounded-xl border border-neutral-200 px-3 text-sm text-neutral-700 outline-none transition focus:border-black"
                    />
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
