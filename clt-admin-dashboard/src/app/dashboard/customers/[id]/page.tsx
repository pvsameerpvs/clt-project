"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { AdminCustomerDetails, AdminCustomerOrder, getAdminCustomerDetails } from "@/lib/admin-api"

function toText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function fullName(firstName?: string | null, lastName?: string | null) {
  const value = [firstName, lastName].filter(Boolean).join(" ").trim()
  return value || "Unnamed Customer"
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

function getAddressLabel(address: Record<string, unknown>, index: number) {
  return toText(address.title) || `Address ${index + 1}`
}

function getAddressSummary(address: Record<string, unknown>) {
  const line1 = toText(address.line1)
  const line2 = toText(address.line2)
  const city = toText(address.city)
  const state = toText(address.state)
  const country = toText(address.country)
  const zip = toText(address.postal_code)

  const lineParts = [line1, line2].filter(Boolean).join(", ")
  const locationParts = [city, state, zip, country].filter(Boolean).join(", ")
  const phone = toText(address.phone)
  const contact = toText(address.contact_name)

  return {
    contact,
    phone,
    line: [lineParts, locationParts].filter(Boolean).join(", "),
  }
}

function getOrderAddress(order: AdminCustomerOrder) {
  if (!order.shipping_address || typeof order.shipping_address !== "object") {
    return ""
  }
  const title = toText(order.shipping_address.title)
  const city = toText(order.shipping_address.city)
  const country = toText(order.shipping_address.country)
  return [title, city, country].filter(Boolean).join(" • ") || "Address not set"
}

export default function CustomerDetailsPage() {
  const params = useParams()
  const customerIdParam = params?.id
  const customerId = Array.isArray(customerIdParam) ? customerIdParam[0] : customerIdParam || ""

  const [details, setDetails] = useState<AdminCustomerDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!customerId) return

    let mounted = true

    async function loadDetails() {
      try {
        setLoading(true)
        setError(null)
        const result = await getAdminCustomerDetails(customerId)
        if (!mounted) return
        setDetails(result)
      } catch (loadError) {
        if (!mounted) return
        setError(loadError instanceof Error ? loadError.message : "Unable to load customer details.")
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadDetails()
    return () => {
      mounted = false
    }
  }, [customerId])

  const stats = useMemo(() => {
    if (!details) {
      return {
        totalOrders: 0,
        totalSpent: 0,
        deliveredOrders: 0,
      }
    }

    const totalOrders = details.orders.length
    const totalSpent = details.orders
      .filter((order) => order.status !== "cancelled" && order.status !== "refunded")
      .reduce((sum, order) => sum + Number(order.total || 0), 0)
    const deliveredOrders = details.orders.filter((order) => order.status === "delivered").length

    return {
      totalOrders,
      totalSpent,
      deliveredOrders,
    }
  }, [details])

  if (loading) {
    return (
      <div className="customer-detail-page">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-44 w-full" />
        <div className="skeleton h-64 w-full" />
      </div>
    )
  }

  if (error || !details) {
    return (
      <div className="customer-detail-page">
        <div className="error-box">{error || "Customer details not available."}</div>
        <Link href="/dashboard/customers" className="back-link">
          Back to Customers
        </Link>
        <style jsx>{`
          .customer-detail-page {
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
          }
        `}</style>
      </div>
    )
  }

  const customer = details.customer
  const customerName = fullName(customer.firstName, customer.lastName)

  return (
    <div className="customer-detail-page">
      <header className="detail-header">
        <div>
          <Link href="/dashboard/customers" className="back-link">
            Back to Customers
          </Link>
          <h1>{customerName}</h1>
          <p>Customer profile, saved shipping addresses from orders, and order history.</p>
        </div>
      </header>

      <section className="profile-card">
        <div className="avatar">{customerName[0]?.toUpperCase() || "C"}</div>
        <div className="profile-meta">
          <h2>{customerName}</h2>
          <p>{customer.email || "No email"}</p>
          <p>{customer.phone || "No phone"}</p>
          <p>Role: {customer.role}</p>
          <p>Joined: {formatUtcDate(customer.createdAt)}</p>
        </div>
        <div className="profile-stats">
          <article>
            <p>Total Orders</p>
            <h3>{stats.totalOrders}</h3>
          </article>
          <article>
            <p>Total Spent</p>
            <h3>AED {Math.round(stats.totalSpent).toLocaleString()}</h3>
          </article>
          <article>
            <p>Delivered</p>
            <h3>{stats.deliveredOrders}</h3>
          </article>
        </div>
      </section>

      <section className="panel">
        <h3>Shipping Addresses ({details.shippingAddresses.length})</h3>
        {details.shippingAddresses.length === 0 ? (
          <div className="empty">No shipping address found for this customer yet.</div>
        ) : (
          <div className="address-grid">
            {details.shippingAddresses.map((address, index) => {
              const record = address as Record<string, unknown>
              const summary = getAddressSummary(record)

              return (
                <article key={`${getAddressLabel(record, index)}-${index}`} className="address-card">
                  <p className="address-title">{getAddressLabel(record, index)}</p>
                  {summary.contact && <p className="address-contact">{summary.contact}</p>}
                  <p className="address-line">{summary.line || "Address line missing"}</p>
                  {summary.phone && <p className="address-phone">{summary.phone}</p>}
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="panel">
        <h3>Orders ({details.orders.length})</h3>
        {details.orders.length === 0 ? (
          <div className="empty">No orders found for this customer.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Shipping Address</th>
                </tr>
              </thead>
              <tbody>
                {details.orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <div className="name">#{order.order_number || order.id.slice(0, 8)}</div>
                      <div className="sub">{order.id}</div>
                    </td>
                    <td className="sub">{formatUtcDate(order.created_at)}</td>
                    <td className="name">AED {Number(order.total || 0).toLocaleString()}</td>
                    <td>
                      <span className={`status ${statusTone(order.status)}`}>{order.status}</span>
                    </td>
                    <td className="sub">{getOrderAddress(order)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <style jsx>{`
        .customer-detail-page {
          display: grid;
          gap: 14px;
        }
        .detail-header h1 {
          margin: 10px 0 0;
          font-size: 30px;
          letter-spacing: -0.02em;
        }
        .detail-header p {
          margin: 6px 0 0;
          color: #6b7280;
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
        .profile-card {
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          background: #fff;
          padding: 16px;
          display: grid;
          gap: 14px;
          grid-template-columns: 56px 1fr 360px;
          align-items: start;
        }
        .avatar {
          width: 56px;
          height: 56px;
          border-radius: 999px;
          background: #111;
          color: #fff;
          display: grid;
          place-items: center;
          font-size: 20px;
          font-weight: 700;
        }
        .profile-meta h2 {
          margin: 0;
          font-size: 20px;
        }
        .profile-meta p {
          margin: 4px 0 0;
          color: #4b5563;
          font-size: 13px;
          word-break: break-word;
        }
        .profile-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }
        .profile-stats article {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #fafafa;
          padding: 10px;
        }
        .profile-stats p {
          margin: 0;
          font-size: 11px;
          color: #6b7280;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .profile-stats h3 {
          margin: 8px 0 0;
          font-size: 20px;
          letter-spacing: -0.02em;
        }
        .panel {
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          background: #fff;
          padding: 12px;
        }
        .panel h3 {
          margin: 0 0 10px;
          font-size: 16px;
        }
        .address-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 10px;
        }
        .address-card {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #fff;
          padding: 12px;
        }
        .address-title {
          margin: 0;
          font-size: 13px;
          font-weight: 700;
          color: #111827;
        }
        .address-contact,
        .address-line,
        .address-phone {
          margin: 6px 0 0;
          color: #4b5563;
          font-size: 13px;
        }
        .table-wrap {
          overflow-x: auto;
        }
        table {
          width: 100%;
          min-width: 860px;
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
          display: inline-flex;
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
          color: #155e75;
        }
        .status.delivered {
          background: #ecfdf5;
          color: #047857;
        }
        .status.cancelled {
          background: #fef2f2;
          color: #b91c1c;
        }
        .status.refunded {
          background: #fdf4ff;
          color: #7e22ce;
        }
        .status.default {
          background: #f3f4f6;
          color: #374151;
        }
        .empty {
          border: 1px dashed #e5e7eb;
          border-radius: 12px;
          text-align: center;
          padding: 26px;
          color: #6b7280;
          font-size: 14px;
        }
        .skeleton {
          border-radius: 12px;
          background: linear-gradient(90deg, #f3f4f6, #e5e7eb, #f3f4f6);
          background-size: 200% 100%;
          animation: pulse 1.2s infinite ease-in-out;
        }
        .h-8 {
          height: 32px;
        }
        .h-44 {
          height: 176px;
        }
        .h-64 {
          height: 256px;
        }
        .w-48 {
          width: 192px;
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
          .profile-card {
            grid-template-columns: 56px 1fr;
          }
          .profile-stats {
            grid-column: 1 / -1;
          }
        }
        @media (max-width: 760px) {
          .profile-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
