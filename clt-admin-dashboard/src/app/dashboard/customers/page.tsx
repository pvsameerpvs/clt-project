"use client"

import { useEffect, useMemo, useState } from "react"
import { AdminCustomer, getAdminCustomers } from "@/lib/admin-api"

export default function CustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const metrics = useMemo(() => {
    return {
      total: customers.length,
      withOrders: customers.filter((customer) => customer.orderCount > 0).length,
      totalSpent: customers.reduce((sum, customer) => sum + Number(customer.totalSpent || 0), 0),
    }
  }, [customers])

  async function loadCustomers() {
    try {
      setLoading(true)
      setError(null)
      setCustomers(await getAdminCustomers())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load customers")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>Customers</h1>
        <button onClick={loadCustomers} style={{ border: "1px solid #d1d5db", background: "#fff", borderRadius: 10, padding: "8px 12px", cursor: "pointer" }}>
          Refresh
        </button>
      </header>

      {error && (
        <div style={{ border: "1px solid #fecaca", background: "#fef2f2", color: "#b91c1c", borderRadius: 12, padding: 12 }}>
          {error}
        </div>
      )}

      <section style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
        <article style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 14, background: "#fff" }}>
          <p style={{ margin: 0, color: "#6b7280", fontSize: 12 }}>Total Customers</p>
          <p style={{ margin: "6px 0 0", fontSize: 24, fontWeight: 600 }}>{metrics.total}</p>
        </article>
        <article style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 14, background: "#fff" }}>
          <p style={{ margin: 0, color: "#6b7280", fontSize: 12 }}>With Orders</p>
          <p style={{ margin: "6px 0 0", fontSize: 24, fontWeight: 600 }}>{metrics.withOrders}</p>
        </article>
        <article style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 14, background: "#fff" }}>
          <p style={{ margin: 0, color: "#6b7280", fontSize: 12 }}>Total Spent</p>
          <p style={{ margin: "6px 0 0", fontSize: 24, fontWeight: 600 }}>AED {metrics.totalSpent.toLocaleString()}</p>
        </article>
      </section>

      <section style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 14, background: "#fff", overflowX: "auto" }}>
        {loading ? (
          <p style={{ margin: 0, color: "#6b7280" }}>Loading customers...</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e5e7eb", textAlign: "left", fontSize: 12, color: "#6b7280" }}>
                <th style={{ padding: "8px 4px" }}>Customer</th>
                <th style={{ padding: "8px 4px" }}>Role</th>
                <th style={{ padding: "8px 4px" }}>Phone</th>
                <th style={{ padding: "8px 4px" }}>Orders</th>
                <th style={{ padding: "8px 4px" }}>Total Spent</th>
                <th style={{ padding: "8px 4px" }}>Last Order</th>
                <th style={{ padding: "8px 4px" }}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "10px 4px" }}>
                    <div style={{ fontWeight: 600 }}>
                      {[customer.firstName, customer.lastName].filter(Boolean).join(" ") || "Unnamed Customer"}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{customer.email || "No email"}</div>
                  </td>
                  <td style={{ padding: "10px 4px" }}>{customer.role}</td>
                  <td style={{ padding: "10px 4px" }}>{customer.phone || "-"}</td>
                  <td style={{ padding: "10px 4px" }}>{customer.orderCount}</td>
                  <td style={{ padding: "10px 4px" }}>AED {Number(customer.totalSpent || 0).toLocaleString()}</td>
                  <td style={{ padding: "10px 4px" }}>{customer.lastOrderAt ? new Date(customer.lastOrderAt).toLocaleDateString() : "-"}</td>
                  <td style={{ padding: "10px 4px" }}>{new Date(customer.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
