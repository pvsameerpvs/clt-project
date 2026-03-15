"use client"

import { useEffect, useState } from "react"
import {
  AdminOrder,
  AdminOrderStatus,
  getAdminOrders,
  ORDER_STATUSES,
  updateAdminOrderStatus,
  getAdminOrderInvoice,
} from "@/lib/admin-api"
import { FileText, Loader2 } from "lucide-react"

function getProfileName(order: AdminOrder) {
  if (!order.profile) return "Guest"
  const profile = Array.isArray(order.profile) ? order.profile[0] : order.profile
  const first = profile?.first_name || ""
  const last = profile?.last_name || ""
  const fullName = `${first} ${last}`.trim()
  return fullName || "Guest"
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [generatingInvoiceId, setGeneratingInvoiceId] = useState<string | null>(null)

  async function loadOrders() {
    try {
      setLoading(true)
      setError(null)
      setOrders(await getAdminOrders())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load orders")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  async function handleStatusChange(orderId: string, status: AdminOrderStatus) {
    // ... logic remains same effectively
    try {
      setUpdatingId(orderId)
      setError(null)
      const updated = await updateAdminOrderStatus(orderId, status)
      setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, ...updated } : order)))
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update status")
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleGenerateInvoice(orderId: string) {
    try {
      setGeneratingInvoiceId(orderId)
      const invoice = await getAdminOrderInvoice(orderId)
      // In a real app, this would open a modal or download a PDF. 
      // For now, we'll alert the success and show it in a simple way or log it.
      alert(`Invoice ${invoice.invoiceNumber} generated for ${invoice.customerName}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate invoice")
    } finally {
      setGeneratingInvoiceId(null)
    }
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>Orders</h1>
        <button onClick={loadOrders} style={{ border: "1px solid #d1d5db", background: "#fff", borderRadius: 10, padding: "8px 12px", cursor: "pointer" }}>
          Refresh
        </button>
      </header>

      {error && (
        <div style={{ border: "1px solid #fecaca", background: "#fef2f2", color: "#b91c1c", borderRadius: 12, padding: 12 }}>
          {error}
        </div>
      )}

      <section style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 14, background: "#fff", overflowX: "auto" }}>
        {loading ? (
          <p style={{ margin: 0, color: "#6b7280" }}>Loading orders...</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e5e7eb", textAlign: "left", fontSize: 12, color: "#6b7280" }}>
                <th style={{ padding: "8px 4px" }}>Order</th>
                <th style={{ padding: "8px 4px" }}>Customer</th>
                <th style={{ padding: "8px 4px" }}>Total</th>
                <th style={{ padding: "8px 4px" }}>Created</th>
                <th style={{ padding: "8px 4px" }}>Status</th>
                <th style={{ padding: "8px 4px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "10px 4px" }}>
                    <div style={{ fontWeight: 600 }}>#{order.order_number || order.id.slice(0, 8)}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{order.id.slice(0, 14)}...</div>
                  </td>
                  <td style={{ padding: "10px 4px" }}>{getProfileName(order)}</td>
                  <td style={{ padding: "10px 4px" }}>AED {Number(order.total || 0).toLocaleString()}</td>
                  <td style={{ padding: "10px 4px" }}>{new Date(order.created_at).toLocaleString()}</td>
                  <td style={{ padding: "10px 4px" }}>
                    <select
                      value={order.status}
                      onChange={(event) => handleStatusChange(order.id, event.target.value as AdminOrderStatus)}
                      disabled={updatingId === order.id}
                      style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: "6px 8px" }}
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: "10px 4px" }}>
                    <button 
                      onClick={() => handleGenerateInvoice(order.id)}
                      disabled={generatingInvoiceId === order.id}
                      style={{ 
                        border: "1px solid #e5e7eb", 
                        background: "#fff", 
                        borderRadius: 8, 
                        padding: "6px 10px", 
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 12
                      }}
                    >
                      {generatingInvoiceId === order.id ? (
                        <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                      ) : (
                        <FileText size={14} />
                      )}
                      Invoice
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
