"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AdminOrder,
  AdminOrderStatus,
  getAllowedAdminOrderStatuses,
  getAdminOrders,
  ORDER_STATUSES,
  updateAdminOrderStatus,
} from "@/lib/admin-api"
import { getAdminOrderCustomer } from "@/lib/admin-order-contact"
import { getAdminOrderPaymentBadge } from "@/lib/admin-order-payment"

function getProfileName(order: AdminOrder) {
  return getAdminOrderCustomer(order).name
}

function formatUtcDate(dateString: string) {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return "—"
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")
  const hour = String(date.getUTCHours()).padStart(2, "0")
  const minute = String(date.getUTCMinutes()).padStart(2, "0")
  return `${year}-${month}-${day} ${hour}:${minute} UTC`
}

const ONLINE_REVENUE_STATUSES = new Set(["paid", "confirmed", "processing", "shipped", "delivered"])
const COD_REVENUE_STATUSES = new Set(["pending", "confirmed", "processing", "shipped", "delivered"])
const UNPAID_ONLINE_STATUSES = new Set(["pending"])
const CLOSED_STATUSES = new Set(["cancelled", "canceled", "refunded"])

function isCashOnDelivery(paymentMethod?: string | null) {
  const method = String(paymentMethod || "").toLowerCase().trim()
  return method === "" || method.includes("cash") || method.includes("cod")
}

function isRevenueOrder(order: Pick<AdminOrder, "status" | "payment_method">) {
  const status = String(order.status || "").toLowerCase().trim()
  if (CLOSED_STATUSES.has(status)) return false
  return isCashOnDelivery(order.payment_method)
    ? COD_REVENUE_STATUSES.has(status)
    : ONLINE_REVENUE_STATUSES.has(status)
}

function isUnpaidOnlineOrder(order: Pick<AdminOrder, "status" | "payment_method">) {
  if (isCashOnDelivery(order.payment_method)) return false
  const status = String(order.status || "").toLowerCase().trim()
  return UNPAID_ONLINE_STATUSES.has(status)
}

function isOpenRevenueOrder(order: Pick<AdminOrder, "status" | "payment_method">) {
  const status = String(order.status || "").toLowerCase().trim()
  return isRevenueOrder(order) && status !== "delivered"
}

function statusTone(status: string) {
  switch (status) {
    case "pending":
      return "pending"
    case "confirmed":
      return "confirmed"
    case "processing":
      return "processing"
    case "shipped":
      return "shipped"
    case "delivered":
      return "delivered"
    case "cancelled":
      return "cancelled"
    case "refunded":
      return "refunded"
    default:
      return "default"
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<"today" | "all">("today")
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await getAdminOrders({
        scope: activeTab,
        status: statusFilter !== "all" ? statusFilter : undefined,
        query: query.trim() || undefined,
        dateFrom: activeTab === "all" ? dateFrom || undefined : undefined,
        dateTo: activeTab === "all" ? dateTo || undefined : undefined,
      })

      setOrders(result)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load orders.")
    } finally {
      setLoading(false)
    }
  }, [activeTab, dateFrom, dateTo, query, statusFilter])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrders()
    }, 250)

    return () => clearTimeout(timer)
  }, [loadOrders])

  async function handleStatusChange(orderId: string, status: AdminOrderStatus) {
    try {
      setUpdatingId(orderId)
      setError(null)
      const updated = await updateAdminOrderStatus(orderId, status)
      setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, ...updated } : order)))
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update order status.")
    } finally {
      setUpdatingId(null)
    }
  }

  function resetFilters() {
    setQuery("")
    setStatusFilter("all")
    setDateFrom("")
    setDateTo("")
  }

  const stats = useMemo(() => {
    let revenue = 0
    let pendingRevenue = 0
    let pendingCount = 0
    let fulfilledCount = 0

    for (const order of orders) {
      const total = Number(order.total || 0)
      if (isRevenueOrder(order)) {
        revenue += total
        if (order.status === "delivered") fulfilledCount++
      } else if (isUnpaidOnlineOrder(order)) {
        pendingRevenue += total
      }

      if (isOpenRevenueOrder(order)) pendingCount++
    }

    return {
      total: orders.length,
      revenue,
      pendingRevenue,
      pendingCount,
      fulfilledCount,
    }
  }, [orders])

  return (
    <div className="orders-page">
      <header className="orders-header">
        <div>
          <h1>Orders</h1>
          <p>Server-side filters with Today / All tabs and date-based order search.</p>
        </div>
        <button className="ghost-btn" onClick={loadOrders} type="button">
          Refresh
        </button>
      </header>

      {error && <div className="error-box">{error}</div>}

      <section className="tabs-row">
        <button
          type="button"
          className={`tab-btn ${activeTab === "today" ? "active" : ""}`}
          onClick={() => setActiveTab("today")}
        >
          Today Orders
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All Orders
        </button>
        <p className="result-count">{loading ? "Loading..." : `${orders.length} result(s)`}</p>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <p>Total Orders</p>
          <h3>{stats.total}</h3>
        </article>
        <article className="stat-card">
          <p>Total Revenue</p>
          <h3 className="text-emerald-600">AED {Math.round(stats.revenue).toLocaleString()}</h3>
        </article>
        <article className="stat-card">
          <p>Pending Online</p>
          <h3 className="text-amber-600">AED {Math.round(stats.pendingRevenue).toLocaleString()}</h3>
        </article>
        <article className="stat-card">
          <p>Open Orders</p>
          <h3>{stats.pendingCount}</h3>
        </article>
        <article className="stat-card">
          <p>Delivered</p>
          <h3>{stats.fulfilledCount}</h3>
        </article>
      </section>

      <section className="panel controls">
        <input
          className="search"
          placeholder="Search by order id, order number, customer, status"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select
          className="status-filter"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="all">All statuses</option>
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <input
          type="date"
          className="date-filter"
          value={dateFrom}
          onChange={(event) => setDateFrom(event.target.value)}
          disabled={activeTab === "today"}
        />
        <input
          type="date"
          className="date-filter"
          value={dateTo}
          onChange={(event) => setDateTo(event.target.value)}
          disabled={activeTab === "today"}
        />
        <button className="ghost-btn" type="button" onClick={resetFilters}>
          Reset Filters
        </button>
      </section>

      <section className="panel table-panel">
        {loading ? (
          <div className="empty">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="empty">No orders match your current server filters.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Created</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Current Status</th>
                  <th>Update Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const paymentBadge = getAdminOrderPaymentBadge(order)
                  const allowedStatuses = getAllowedAdminOrderStatuses(order)
                  return (
                    <tr key={order.id}>
                      <td>
                        <div className="name">#{order.order_number || order.id.slice(0, 8)}</div>
                        <div className="sub">{order.id}</div>
                        <Link href={`/dashboard/orders/${encodeURIComponent(order.id)}`} className="detail-link">
                          Open details
                        </Link>
                      </td>
                      <td>
                        <div className="name">
                          {getProfileName(order)}
                          {!order.user_id && <span className="guest-tag">Guest</span>}
                        </div>
                      </td>
                      <td className="sub">{formatUtcDate(order.created_at)}</td>
                      <td className="name">AED {Number(order.total || 0).toLocaleString()}</td>
                      <td>
                        <span className={`payment-badge ${paymentBadge.tone}`} title={paymentBadge.title}>
                          {paymentBadge.label}
                        </span>
                      </td>
                      <td>
                        <span className={`status ${statusTone(order.status)}`}>{order.status}</span>
                      </td>
                      <td>
                        <div className="action-cell">
                          <select
                            value={order.status}
                            onChange={(event) => handleStatusChange(order.id, event.target.value as AdminOrderStatus)}
                            disabled={updatingId === order.id}
                          >
                            {allowedStatuses.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                          <span className="save-state">{updatingId === order.id ? "Saving..." : "Saved"}</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <style jsx>{`
        .orders-page {
          display: grid;
          gap: 14px;
        }
        .orders-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }
        .orders-header h1 {
          margin: 0;
          font-size: 28px;
          letter-spacing: -0.02em;
        }
        .orders-header p {
          margin: 6px 0 0;
          color: #6b7280;
          font-size: 14px;
        }
        .tabs-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .tab-btn {
          border: 1px solid #d1d5db;
          background: #fff;
          border-radius: 999px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          cursor: pointer;
        }
        .tab-btn.active {
          background: #111827;
          border-color: #111827;
          color: #fff;
        }
        .result-count {
          margin: 0 0 0 auto;
          color: #6b7280;
          font-size: 12px;
        }
        .error-box {
          border: 1px solid #fecaca;
          background: #fef2f2;
          color: #b91c1c;
          border-radius: 12px;
          padding: 12px;
          font-size: 14px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 10px;
        }
        .text-emerald-600 {
          color: #059669;
        }
        .text-amber-600 {
          color: #d97706;
        }
        .stat-card {
          border: 1px solid #e5e7eb;
          background: #fff;
          border-radius: 12px;
          padding: 12px;
        }
        .stat-card p {
          margin: 0;
          color: #6b7280;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .stat-card h3 {
          margin: 8px 0 0;
          font-size: 24px;
          letter-spacing: -0.02em;
        }
        .panel {
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          background: #fff;
        }
        .controls {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr auto;
          gap: 10px;
          padding: 12px;
        }
        .search,
        .status-filter,
        .date-filter,
        .action-cell select {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          padding: 8px 10px;
          font-size: 14px;
          background: #fff;
        }
        .date-filter:disabled {
          background: #f9fafb;
          color: #9ca3af;
        }
        .table-panel {
          padding: 12px;
        }
        .table-wrap {
          overflow-x: auto;
        }
        table {
          width: 100%;
          min-width: 1040px;
          border-collapse: collapse;
        }
        th {
          text-align: left;
          padding: 10px 8px;
          border-bottom: 1px solid #e5e7eb;
          font-size: 11px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        td {
          padding: 12px 8px;
          border-bottom: 1px solid #f3f4f6;
          font-size: 14px;
          vertical-align: top;
        }
        .name {
          font-weight: 600;
        }
        .sub {
          color: #6b7280;
          font-size: 12px;
          margin-top: 2px;
          word-break: break-word;
        }
        .detail-link {
          display: inline-flex;
          margin-top: 8px;
          text-decoration: none;
          border: 1px solid #d1d5db;
          border-radius: 999px;
          padding: 3px 8px;
          font-size: 11px;
          font-weight: 700;
          color: #111827;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          background: #fff;
        }
        .detail-link:hover {
          border-color: #111827;
        }
        .status {
          display: inline-block;
          border-radius: 999px;
          padding: 4px 8px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .status.pending {
          background: #fff7ed;
          color: #9a3412;
        }
        .status.confirmed {
          background: #eff6ff;
          color: #1d4ed8;
        }
        .status.processing {
          background: #eef2ff;
          color: #4338ca;
        }
        .status.shipped {
          background: #ecfeff;
          color: #0e7490;
        }
        .status.delivered {
          background: #f0fdf4;
          color: #166534;
        }
        .status.cancelled,
        .status.refunded {
          background: #fef2f2;
          color: #991b1b;
        }
        .status.default {
          background: #f3f4f6;
          color: #111827;
        }
        .guest-tag {
          display: inline-block;
          margin-left: 8px;
          background: #f3f4f6;
          color: #6b7280;
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          vertical-align: middle;
        }
        .payment-badge {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 4px 8px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          white-space: nowrap;
        }
        .payment-badge.paid {
          background: #ecfdf5;
          color: #047857;
        }
        .payment-badge.unpaid {
          background: #fff7ed;
          color: #9a3412;
        }
        .payment-badge.cod {
          background: #f5f3ff;
          color: #6d28d9;
        }
        .payment-badge.refunded {
          background: #fef2f2;
          color: #991b1b;
        }
        .action-cell {
          display: grid;
          gap: 6px;
        }
        .save-state {
          font-size: 12px;
          color: #6b7280;
        }
        .empty {
          border: 1px dashed #e5e7eb;
          border-radius: 12px;
          text-align: center;
          padding: 32px;
          color: #6b7280;
          font-size: 14px;
        }
        .ghost-btn {
          border: 1px solid #d1d5db;
          background: #fff;
          border-radius: 10px;
          padding: 8px 12px;
          font-size: 13px;
          cursor: pointer;
          white-space: nowrap;
        }
        @media (max-width: 1100px) {
          .controls {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .result-count {
            margin-left: 0;
            width: 100%;
          }
        }
        @media (max-width: 980px) {
          .stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 720px) {
          .orders-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .stats-grid {
            grid-template-columns: 1fr;
          }
          .controls {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
