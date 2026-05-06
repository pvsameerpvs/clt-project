import Link from "next/link"
import { ClipboardList, PackageCheck, RotateCcw, ShieldCheck } from "lucide-react"
import type { ReturnRequestRecord } from "@/lib/api"
import type { OrderRecord } from "./profile-types"
import { OrderPaymentBadge } from "./order-payment-badge"
import { canCancelOrder, canRequestReturn, normalizeReturnRequestStatus } from "./profile-utils"

type ProfileReturnsSectionProps = {
  ordersLoading: boolean
  returnsLoading: boolean
  orders: OrderRecord[]
  returnRequests: ReturnRequestRecord[]
  orderActionLoadingId: string | null
  onCancelOrder: (orderId: string) => void
  onRequestReturn: (orderId: string) => void
  getReturnRequestStatus: (orderId: string) => string | null
}

function returnStatusTone(status: string) {
  switch (status) {
    case "approved":
    case "refunded":
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-100"
    case "rejected":
      return "border-red-200 bg-red-50 text-red-700 shadow-sm shadow-red-100"
    default:
      return "border-amber-200 bg-amber-50 text-amber-700 shadow-sm shadow-amber-100"
  }
}

export function ProfileReturnsSection({
  ordersLoading,
  returnsLoading,
  orders,
  returnRequests,
  orderActionLoadingId,
  onCancelOrder,
  onRequestReturn,
  getReturnRequestStatus,
}: ProfileReturnsSectionProps) {
  const cancellableOrders = orders.filter((order) => canCancelOrder(order.status, order.payment_method))
  const returnEligibleOrders = orders.filter((order) => canRequestReturn(order.status, order.delivered_at))

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl text-neutral-900">Returns & Cancel</h2>
          <p className="mt-1 text-sm text-neutral-500">Manage order cancellations and return requests with policy-compliant actions.</p>
        </div>
        <Link
          href="/returns-refund-policy"
          className="inline-flex items-center rounded-full border border-black bg-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-white hover:text-black shadow-lg shadow-black/5"
        >
          View Policy
        </Link>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <article className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-neutral-700">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Policy Window</p>
          <p className="mt-1 text-sm text-neutral-700">Returns accepted within 24 hours of delivery only.</p>
        </article>
        <article className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-neutral-700">
            <PackageCheck className="h-4 w-4" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Defect Reporting</p>
          <p className="mt-1 text-sm text-neutral-700">Damaged or leaking products must be reported within 24 hours.</p>
        </article>
        <article className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-neutral-700">
            <RotateCcw className="h-4 w-4" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Refund Method</p>
          <p className="mt-1 text-sm text-neutral-700">Approved refunds are returned to the original payment method.</p>
        </article>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-neutral-200 bg-white p-4 md:p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-neutral-700">
              <ClipboardList className="h-3.5 w-3.5" />
            </span>
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-neutral-500">Cancel Eligible Orders</h3>
          </div>

          {ordersLoading ? (
            <p className="text-sm text-neutral-600">Loading orders...</p>
          ) : cancellableOrders.length === 0 ? (
            <p className="text-sm text-neutral-600">No active orders available for cancellation.</p>
          ) : (
            <div className="space-y-3">
              {cancellableOrders.map((order) => (
                <div key={`cancel-${order.id}`} className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-neutral-900">#{order.order_number || order.id.slice(0, 8).toUpperCase()}</p>
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <span className="rounded-full border border-neutral-300 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-600">
                        {order.status || "pending"}
                      </span>
                      <OrderPaymentBadge order={order} className="px-2 py-0.5 tracking-[0.08em]" />
                    </div>
                  </div>
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

        <article className="rounded-2xl border border-neutral-200 bg-white p-4 md:p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-neutral-700">
              <RotateCcw className="h-3.5 w-3.5" />
            </span>
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-neutral-500">Return Request History</h3>
          </div>

          {returnsLoading ? (
            <p className="text-sm text-neutral-600">Loading return requests...</p>
          ) : returnRequests.length === 0 ? (
            <p className="text-sm text-neutral-600">No return requests submitted yet.</p>
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
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        {request.order ? (
                          <OrderPaymentBadge order={request.order} className="px-2 py-0.5 tracking-[0.08em]" />
                        ) : null}
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${returnStatusTone(status)}`}>
                          {status}
                        </span>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">Requested on {new Date(request.created_at).toLocaleDateString("en-GB")}</p>
                    {request.reason && <p className="mt-2 text-xs text-neutral-600">Reason: {request.reason}</p>}
                    {status === 'rejected' && <p className="mt-1 text-[10px] text-red-500 italic">Check email for more info</p>}
                  </div>
                )
              })}
            </div>
          )}
        </article>
      </div>

      <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4 md:p-5">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-neutral-500">Delivered Orders Eligible for Return</h3>
        {ordersLoading ? (
          <p className="text-sm text-neutral-600">Loading delivered orders...</p>
        ) : returnEligibleOrders.length === 0 ? (
          <p className="text-sm text-neutral-600">No delivered orders available for return request.</p>
        ) : (
          <div className="space-y-3">
            {returnEligibleOrders.map((order) => {
              const returnStatus = getReturnRequestStatus(order.id)
              
              return (
                <div key={`return-${order.id}`} className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-neutral-900">#{order.order_number || order.id.slice(0, 8).toUpperCase()}</p>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <OrderPaymentBadge order={order} className="px-2 py-0.5 tracking-[0.08em]" />
                      <p className="text-xs text-neutral-500">AED {Number(order.total || 0).toFixed(2)}</p>
                    </div>
                  </div>
                  
                  {returnStatus === 'pending' && (
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-amber-700">Return request already submitted</p>
                  )}
                  {returnStatus === 'approved' && (
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">Return request approved</p>
                  )}
                  {returnStatus === 'rejected' && (
                    <div className="mt-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-red-700">Return request rejected</p>
                      <p className="text-[10px] text-neutral-500 italic mt-0.5">Check email for more info</p>
                    </div>
                  )}
                  {!returnStatus && (
                    <button
                      type="button"
                      onClick={() => onRequestReturn(order.id)}
                      disabled={orderActionLoadingId === order.id}
                      className="mt-2 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-neutral-700 transition hover:border-black hover:text-black disabled:opacity-60"
                    >
                      {orderActionLoadingId === order.id ? "Submitting..." : "Submit Return Request"}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
