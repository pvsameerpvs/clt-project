import Link from "next/link"
import type { ReturnRequestRecord } from "@/lib/api"
import type { OrderRecord } from "./profile-types"
import { canCancelOrder, canRequestReturn, normalizeReturnRequestStatus } from "./profile-utils"

type ProfileReturnsSectionProps = {
  ordersLoading: boolean
  returnsLoading: boolean
  orders: OrderRecord[]
  returnRequests: ReturnRequestRecord[]
  orderActionLoadingId: string | null
  returnReasonByOrder: Record<string, string>
  onReturnReasonChange: (orderId: string, reason: string) => void
  onCancelOrder: (orderId: string) => void
  onRequestReturn: (orderId: string) => void
  hasOpenReturnRequest: (orderId: string) => boolean
}

export function ProfileReturnsSection({
  ordersLoading,
  returnsLoading,
  orders,
  returnRequests,
  orderActionLoadingId,
  returnReasonByOrder,
  onReturnReasonChange,
  onCancelOrder,
  onRequestReturn,
  hasOpenReturnRequest,
}: ProfileReturnsSectionProps) {
  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-serif text-2xl text-neutral-900">Returns & Cancel</h2>
        <Link href="/returns-refund-policy" className="text-sm font-semibold text-black underline underline-offset-4">
          View Policy
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-neutral-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-neutral-500">Cancel Orders</h3>
          {ordersLoading ? (
            <p className="text-sm text-neutral-600">Loading orders...</p>
          ) : orders.filter((order) => canCancelOrder(order.status)).length === 0 ? (
            <p className="text-sm text-neutral-600">No orders available for cancellation.</p>
          ) : (
            <div className="space-y-3">
              {orders
                .filter((order) => canCancelOrder(order.status))
                .map((order) => (
                  <div key={`cancel-${order.id}`} className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                    <p className="text-sm font-semibold text-neutral-900">#{order.order_number || order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {new Date(order.created_at).toLocaleDateString("en-GB")} • AED {Number(order.total || 0).toFixed(2)}
                    </p>
                    <button
                      type="button"
                      onClick={() => onCancelOrder(order.id)}
                      disabled={orderActionLoadingId === order.id}
                      className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-red-700 transition hover:border-red-300 disabled:opacity-60"
                    >
                      {orderActionLoadingId === order.id ? "Cancelling..." : "Cancel Order"}
                    </button>
                  </div>
                ))}
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-neutral-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-neutral-500">Return Requests</h3>
          {returnsLoading ? (
            <p className="text-sm text-neutral-600">Loading return requests...</p>
          ) : returnRequests.length === 0 ? (
            <p className="text-sm text-neutral-600">No return requests yet.</p>
          ) : (
            <div className="space-y-3">
              {returnRequests.map((request) => {
                const status = normalizeReturnRequestStatus(request.status)
                return (
                  <div key={request.id} className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-neutral-900">
                        #{request.order?.order_number || request.order_id.slice(0, 8).toUpperCase()}
                      </p>
                      <span className="rounded-full border border-neutral-300 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-600">
                        {status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">Requested on {new Date(request.created_at).toLocaleDateString("en-GB")}</p>
                    {request.reason && <p className="mt-2 text-xs text-neutral-600">Reason: {request.reason}</p>}
                  </div>
                )
              })}
            </div>
          )}
        </article>
      </div>

      <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-neutral-500">Delivered Orders Eligible For Return</h3>
        {ordersLoading ? (
          <p className="text-sm text-neutral-600">Loading delivered orders...</p>
        ) : orders.filter((order) => canRequestReturn(order.status)).length === 0 ? (
          <p className="text-sm text-neutral-600">No delivered orders available for return request.</p>
        ) : (
          <div className="space-y-3">
            {orders
              .filter((order) => canRequestReturn(order.status))
              .map((order) => (
                <div key={`return-${order.id}`} className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-neutral-900">#{order.order_number || order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-neutral-500">AED {Number(order.total || 0).toFixed(2)}</p>
                  </div>
                  {hasOpenReturnRequest(order.id) ? (
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-amber-700">Return request already submitted</p>
                  ) : (
                    <>
                      <input
                        value={returnReasonByOrder[order.id] || ""}
                        onChange={(event) => onReturnReasonChange(order.id, event.target.value)}
                        placeholder="Return reason (optional)"
                        className="mt-2 h-10 w-full rounded-xl border border-neutral-200 px-3 text-sm text-neutral-700 outline-none transition focus:border-black"
                      />
                      <button
                        type="button"
                        onClick={() => onRequestReturn(order.id)}
                        disabled={orderActionLoadingId === order.id}
                        className="mt-2 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-neutral-700 transition hover:border-black hover:text-black disabled:opacity-60"
                      >
                        {orderActionLoadingId === order.id ? "Submitting..." : "Submit Return Request"}
                      </button>
                    </>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </section>
  )
}
