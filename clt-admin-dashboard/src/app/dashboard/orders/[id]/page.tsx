"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  AdminOrder,
  AdminOrderStatus,
  getAdminOrderDetails,
  ORDER_STATUSES,
  updateAdminOrderStatus,
} from "@/lib/admin-api"

function toText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function formatUtcDate(dateString?: string | null) {
  if (!dateString) return "—"
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return "—"
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")
  const hour = String(date.getUTCHours()).padStart(2, "0")
  const minute = String(date.getUTCMinutes()).padStart(2, "0")
  return `${year}-${month}-${day} ${hour}:${minute} UTC`
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

function formatMoney(value: number | string | null | undefined) {
  return Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function getProfile(order: AdminOrder) {
  if (!order.profile) {
    return { first_name: null, last_name: null, email: null, phone: null }
  }
  return Array.isArray(order.profile) ? order.profile[0] || {} : order.profile
}

export default function OrderDetailsPage() {
  const params = useParams()
  const orderIdParam = params?.id
  const orderId = Array.isArray(orderIdParam) ? orderIdParam[0] : orderIdParam || ""

  const [order, setOrder] = useState<AdminOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) return

    let mounted = true

    async function loadDetails() {
      try {
        setLoading(true)
        setError(null)
        const result = await getAdminOrderDetails(orderId)
        if (!mounted) return
        setOrder(result)
      } catch (loadError) {
        if (!mounted) return
        setError(loadError instanceof Error ? loadError.message : "Unable to load order details.")
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadDetails()

    return () => {
      mounted = false
    }
  }, [orderId])

  async function handleStatusChange(nextStatus: AdminOrderStatus) {
    if (!order) return
    try {
      setUpdatingStatus(true)
      setStatusError(null)
      const updated = await updateAdminOrderStatus(order.id, nextStatus)
      setOrder((prev) => (prev ? { ...prev, status: updated.status } : prev))
    } catch (updateError) {
      setStatusError(updateError instanceof Error ? updateError.message : "Unable to update status.")
    } finally {
      setUpdatingStatus(false)
    }
  }

  const customer = useMemo(() => {
    if (!order) return { name: "Guest", email: "", phone: "" }
    const profile = getProfile(order)
    const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() || "Guest"
    return {
      name,
      email: toText(profile.email),
      phone: toText(profile.phone),
    }
  }, [order])

  const shippingAddress = useMemo(() => {
    if (!order?.shipping_address || typeof order.shipping_address !== "object") {
      return {
        title: "",
        contactName: "",
        phone: "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
      }
    }

    const address = order.shipping_address as Record<string, unknown>
    return {
      title: toText(address.title),
      contactName: toText(address.contact_name),
      phone: toText(address.phone),
      line1: toText(address.line1),
      line2: toText(address.line2),
      city: toText(address.city),
      state: toText(address.state),
      postalCode: toText(address.postal_code),
      country: toText(address.country),
    }
  }, [order])

  if (loading) {
    return (
      <div className="order-detail-page">
        <div className="skeleton h-8 w-56" />
        <div className="skeleton h-44 w-full" />
        <div className="skeleton h-72 w-full" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="order-detail-page">
        <div className="error-box">{error || "Order details not available."}</div>
        <Link href="/dashboard/orders" className="back-link">
          Back to Orders
        </Link>
        <style jsx>{`
          .order-detail-page {
            display: grid;
            gap: 12px;
          }
          .error-box {
            border: 1px solid #fecaca;
            background: #fef2f2;
            color: #b91c1c;
            border-radius: 12px;
            padding: 12px;
            font-size: 14px;
          }
          .back-link {
            display: inline-flex;
            width: fit-content;
            border: 1px solid #d1d5db;
            border-radius: 10px;
            padding: 8px 12px;
            color: #111827;
            text-decoration: none;
            font-size: 13px;
            font-weight: 600;
            background: #fff;
          }
        `}</style>
      </div>
    )
  }

  const items = Array.isArray(order.items) ? order.items : []

  return (
    <div className="order-detail-page">
      <header className="detail-header">
        <div>
          <Link href="/dashboard/orders" className="back-link">
            Back to Orders
          </Link>
          <h1>Order #{order.order_number || order.id.slice(0, 8)}</h1>
          <p>Slug: {order.id}</p>
        </div>
        <div className="status-panel">
          <span className={`status ${statusTone(order.status)}`}>{order.status}</span>
          <label className="status-label">Current Status</label>
          <select
            className="status-select"
            value={order.status}
            onChange={(event) => handleStatusChange(event.target.value as AdminOrderStatus)}
            disabled={updatingStatus}
          >
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <p className="status-state">{updatingStatus ? "Updating..." : "Status synced"}</p>
          {statusError && <p className="status-error">{statusError}</p>}
        </div>
      </header>

      <section className="summary-grid">
        <article className="summary-card">
          <p>Created At</p>
          <h3>{formatUtcDate(order.created_at)}</h3>
        </article>
        <article className="summary-card">
          <p>Subtotal</p>
          <h3>AED {formatMoney(order.subtotal)}</h3>
        </article>
        <article className="summary-card">
          <p>Tax</p>
          <h3>AED {formatMoney(order.tax)}</h3>
        </article>
        <article className="summary-card">
          <p>Shipping</p>
          <h3>AED {formatMoney(order.shipping_fee)}</h3>
        </article>
        <article className="summary-card total">
          <p>Total</p>
          <h3>AED {formatMoney(order.total)}</h3>
        </article>
      </section>

      <section className="grid-two">
        <article className="panel">
          <h3>Customer Details</h3>
          <div className="meta-list">
            <div>
              <label>Name</label>
              <p>{customer.name}</p>
            </div>
            <div>
              <label>Email</label>
              <p>{customer.email || "No email"}</p>
            </div>
            <div>
              <label>Phone</label>
              <p>{customer.phone || "No phone"}</p>
            </div>
          </div>
        </article>

        <article className="panel">
          <h3>Shipping Address</h3>
          <div className="meta-list">
            <div>
              <label>Address Title</label>
              <p>{shippingAddress.title || "Not set"}</p>
            </div>
            <div>
              <label>Contact Name</label>
              <p>{shippingAddress.contactName || "Not set"}</p>
            </div>
            <div>
              <label>Phone</label>
              <p>{shippingAddress.phone || "Not set"}</p>
            </div>
            <div>
              <label>Line 1</label>
              <p>{shippingAddress.line1 || "Not set"}</p>
            </div>
            <div>
              <label>Line 2</label>
              <p>{shippingAddress.line2 || "Not set"}</p>
            </div>
            <div>
              <label>City / State</label>
              <p>{[shippingAddress.city, shippingAddress.state].filter(Boolean).join(", ") || "Not set"}</p>
            </div>
            <div>
              <label>Postal Code</label>
              <p>{shippingAddress.postalCode || "Not set"}</p>
            </div>
            <div>
              <label>Country</label>
              <p>{shippingAddress.country || "Not set"}</p>
            </div>
          </div>
        </article>
      </section>

      {order.return_requests && order.return_requests.length > 0 && (
        <section className="panel return-panel" style={{ border: '1px solid #e5e7eb', borderRadius: '14px', background: '#fff', padding: '14px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '16px' }}>Return Requests</h3>
          <div className="return-list" style={{ display: 'grid', gap: '12px' }}>
            {order.return_requests.map((req) => (
              <div key={req.id} className="return-item" style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: '12px' }}>
                <div className="return-meta" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span className={`status ${statusTone(req.status)}`}>{req.status}</span>
                  <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6b7280' }}>Reason for Return</label>
                </div>
                <p className="return-reason" style={{ fontSize: '14px', color: '#111827', margin: 0 }}>{req.reason || "No reason provided."}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="panel">
        <h3>Order Items ({items.length})</h3>
        {items.length === 0 ? (
          <div className="empty">No order items found.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Image</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const isGift = Number(item.price || 0) === 0;
                  return (
                    <tr key={`${item.product_name}-${index}`}>
                      <td>
                        <div className="item-thumb">
                          {item.product_image ? (
                            <img src={item.product_image} alt={item.product_name} />
                          ) : (
                            <div className="thumb-placeholder">No Image</div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="item-name">
                          {item.product_name}
                          {item.product_ml && (
                            <span className="ml-badge">{item.product_ml} ML</span>
                          )}
                          {isGift && (
                            <span className="gift-badge">GIFT</span>
                          )}
                        </div>
                      </td>
                      <td>{item.quantity}</td>
                      <td>
                        {isGift ? (
                          <span className="text-emerald-600 font-bold">FREE</span>
                        ) : (
                          `AED ${formatMoney(item.price)}`
                        )}
                      </td>
                      <td className="item-total">
                        {isGift ? (
                          <span className="text-emerald-600 font-bold">FREE</span>
                        ) : (
                          `AED ${formatMoney(Number(item.price || 0) * Number(item.quantity || 0))}`
                        )}
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
        .order-detail-page {
          display: grid;
          gap: 14px;
        }
        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }
        .detail-header h1 {
          margin: 10px 0 0;
          font-size: 30px;
          letter-spacing: -0.02em;
        }
        .detail-header p {
          margin: 6px 0 0;
          color: #6b7280;
          font-size: 13px;
          word-break: break-word;
        }
        .status-panel {
          display: grid;
          gap: 6px;
          width: 220px;
        }
        .status-label {
          font-size: 11px;
          color: #6b7280;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .status-select {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          padding: 8px 10px;
          font-size: 13px;
          background: #fff;
        }
        .status-state {
          margin: 0;
          font-size: 12px;
          color: #6b7280;
        }
        .status-error {
          margin: 0;
          font-size: 12px;
          color: #b91c1c;
        }
        .back-link {
          display: inline-flex;
          width: fit-content;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          padding: 8px 12px;
          color: #111827;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          background: #fff;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 10px;
        }
        .summary-card {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #fff;
          padding: 12px;
        }
        .summary-card p {
          margin: 0;
          color: #6b7280;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .summary-card h3 {
          margin: 8px 0 0;
          font-size: 18px;
          font-weight: 700;
        }
        .summary-card.total {
          border-color: #111827;
        }
        .grid-two {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        .panel {
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          background: #fff;
          padding: 14px;
        }
        .panel h3 {
          margin: 0 0 12px;
          font-size: 16px;
          letter-spacing: -0.01em;
        }
        .meta-list {
          display: grid;
          gap: 10px;
        }
        .meta-list label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #6b7280;
        }
        .meta-list p {
          margin: 4px 0 0;
          color: #111827;
          font-size: 14px;
          word-break: break-word;
        }
        .table-wrap {
          overflow-x: auto;
        }
        table {
          width: 100%;
          min-width: 640px;
          border-collapse: collapse;
        }
        th {
          text-align: left;
          padding: 9px 8px;
          border-bottom: 1px solid #e5e7eb;
          font-size: 11px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        td {
          padding: 11px 8px;
          border-bottom: 1px solid #f3f4f6;
          font-size: 14px;
        }
        .item-name {
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .ml-badge {
          background: #f3f4f6;
          color: #374151;
          padding: 2px 6px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.05em;
          border: 1px solid #e5e7eb;
          white-space: nowrap;
        }
        .gift-badge {
          background: #ecfdf5;
          color: #059669;
          padding: 2px 6px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.05em;
          border: 1px solid #a7f3d0;
          white-space: nowrap;
        }
        .item-thumb {
          width: 50px;
          height: 50px;
          border-radius: 8px;
          overflow: hidden;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
        }
        .item-thumb img {
          width: 100%;
          height: 100%;
          object-cover: cover;
        }
        .thumb-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          color: #9ca3af;
          text-align: center;
          padding: 4px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .item-total {
          font-weight: 700;
        }
        .status {
          display: inline-block;
          border-radius: 999px;
          padding: 6px 10px;
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
        .empty {
          border: 1px dashed #e5e7eb;
          border-radius: 12px;
          text-align: center;
          padding: 28px;
          color: #6b7280;
          font-size: 14px;
        }
        .skeleton {
          border-radius: 12px;
          background: linear-gradient(90deg, #f3f4f6, #e5e7eb, #f3f4f6);
          background-size: 200% 100%;
          animation: pulse 1.4s ease-in-out infinite;
        }
        .h-8 {
          height: 2rem;
        }
        .h-44 {
          height: 11rem;
        }
        .h-72 {
          height: 18rem;
        }
        .w-56 {
          width: 14rem;
        }
        .w-full {
          width: 100%;
        }
        @keyframes pulse {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
        @media (max-width: 1100px) {
          .summary-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .grid-two {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 720px) {
          .detail-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .summary-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
