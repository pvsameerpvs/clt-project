"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AdminOrder,
  AdminOrderStatus,
  getAdminOrders,
  ORDER_STATUSES,
  updateAdminOrderStatus,
} from "@/lib/admin-api"

function getProfileName(order: AdminOrder) {
  if (!order.profile) return "Guest"
  const profile = Array.isArray(order.profile) ? order.profile[0] : order.profile
  const first = profile?.first_name || ""
  const last = profile?.last_name || ""
  const fullName = `${first} ${last}`.trim()
  return fullName || "Guest"
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

function isRevenueOrder(status: string) {
  return status !== "cancelled" && status !== "refunded"
}

function statusTone(status: string) {
  switch (status) {
    case "pending":
      return "pending"
    case "paid":
      return "paid"
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
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  async function loadOrders() {
    try {
      setLoading(true)
      setError(null)
      setOrders(await getAdminOrders())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load orders.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

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

  const filteredOrders = useMemo(() => {
    const text = query.trim().toLowerCase()
    return orders.filter((order) => {
      const orderCode = (order.order_number || order.id).toLowerCase()
      const customer = getProfileName(order).toLowerCase()
      const status = (order.status || "").toLowerCase()
      const matchesSearch = !text || orderCode.includes(text) || customer.includes(text) || status.includes(text)
      const matchesStatus = statusFilter === "all" || order.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [orders, query, statusFilter])

  const stats = useMemo(() => {
    const revenue = orders
      .filter((order) => isRevenueOrder(order.status))
      .reduce((sum, order) => sum + Number(order.total || 0), 0)

    const pending = orders.filter((order) => order.status === "pending" || order.status === "processing").length
    const fulfilled = orders.filter((order) => order.status === "delivered").length

    return {
      total: orders.length,
      revenue,
      pending,
      fulfilled,
    }
  }, [orders])

  return (
    <div className="orders-page">
      <header className="orders-header">
        <div>
          <h1>Orders</h1>
          <p>Track orders, filter quickly, and update lifecycle status in one place.</p>
        </div>
        <button className="ghost-btn" onClick={loadOrders} type="button">
          Refresh
        </button>
      </header>

      {error && <div className="error-box">{error}</div>}

      <section className="stats-grid">
        <article className="stat-card">
          <p>Total Orders</p>
          <h3>{stats.total}</h3>
        </article>
        <article className="stat-card">
          <p>Total Revenue</p>
          <h3>AED {Math.round(stats.revenue).toLocaleString()}</h3>
        </article>
        <article className="stat-card">
          <p>Pending / Processing</p>
          <h3>{stats.pending}</h3>
        </article>
        <article className="stat-card">
          <p>Delivered</p>
          <h3>{stats.fulfilled}</h3>
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
      </section>

      <section className="panel table-panel">
        {loading ? (
          <div className="empty">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty">No orders match your filters.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Created</th>
                  <th>Total</th>
                  <th>Current Status</th>
                  <th>Update Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <div className="name">#{order.order_number || order.id.slice(0, 8)}</div>
                      <div className="sub">{order.id}</div>
                    </td>
                    <td>
                      <div className="name">{getProfileName(order)}</div>
                    </td>
                    <td className="sub">{formatUtcDate(order.created_at)}</td>
                    <td className="name">AED {Number(order.total || 0).toLocaleString()}</td>
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
                          {ORDER_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                        <span className="save-state">
                          {updatingId === order.id ? "Saving..." : "Saved"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
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
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
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
          grid-template-columns: 1fr 200px;
          gap: 10px;
          padding: 12px;
        }
        .search,
        .status-filter,
        .action-cell select {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          padding: 8px 10px;
          font-size: 14px;
          background: #fff;
        }
        .table-panel {
          padding: 12px;
        }
        .table-wrap {
          overflow-x: auto;
        }
        table {
          width: 100%;
          min-width: 940px;
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
        .status.paid {
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
        }
        @media (max-width: 980px) {
          .stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .controls {
            grid-template-columns: 1fr;
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
        }
      `}</style>
    </div>
  )
}
