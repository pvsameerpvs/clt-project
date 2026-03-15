"use client"

import { useEffect, useState } from "react"
import { Loader2, Package, ShoppingBag, TrendingUp, Users } from "lucide-react"
import { AdminDashboardData, getAdminDashboard } from "@/lib/admin-api"

export default function DashboardOverviewPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadData() {
    try {
      setLoading(true)
      setError(null)
      const dashboardData = await getAdminDashboard()
      setData(dashboardData)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <div style={{ minHeight: 320, display: "grid", placeItems: "center" }}>
        <Loader2 size={28} style={{ animation: "spin 1s linear infinite" }} />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div style={{ border: "1px solid #fecaca", background: "#fef2f2", color: "#b91c1c", borderRadius: 12, padding: 14 }}>
        {error || "Unable to load dashboard."}
      </div>
    )
  }

  const maxMonth = Math.max(...data.revenueByMonth.map((m) => m.total), 1)

  const cards = [
    { label: "Total Revenue", value: `AED ${data.totalRevenue.toLocaleString()}`, icon: TrendingUp },
    { label: "Total Orders", value: data.totalOrders.toLocaleString(), icon: ShoppingBag },
    { label: "Total Customers", value: data.totalCustomers.toLocaleString(), icon: Users },
    { label: "Products", value: data.totalProducts.toLocaleString(), icon: Package },
  ]

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>Overview</h1>
          <p style={{ margin: "6px 0 0", color: "#6b7280", fontSize: 14 }}>Live data from `clt-perfume-backend`.</p>
        </div>
        <button
          onClick={loadData}
          style={{ border: "1px solid #d1d5db", background: "#fff", borderRadius: 10, padding: "8px 12px", cursor: "pointer" }}
        >
          Refresh
        </button>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
        {cards.map((card) => (
          <article key={card.label} style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 14, background: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ margin: 0, fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {card.label}
              </p>
              <card.icon size={16} color="#6b7280" />
            </div>
            <p style={{ margin: "10px 0 0", fontSize: 24, fontWeight: 600 }}>{card.value}</p>
          </article>
        ))}
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
        <article style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 14, background: "#fff" }}>
          <h3 style={{ margin: "0 0 10px" }}>Revenue (Last 6 months)</h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 240 }}>
            {data.revenueByMonth.map((month) => {
              const height = Math.max((month.total / maxMonth) * 180, month.total > 0 ? 12 : 4)
              return (
                <div key={month.month} style={{ flex: 1, display: "grid", gap: 6 }}>
                  <div style={{ textAlign: "center", fontSize: 11, color: "#6b7280" }}>AED {Math.round(month.total)}</div>
                  <div style={{ height: 180, border: "1px solid #f3f4f6", borderRadius: 10, background: "#f9fafb", display: "flex", alignItems: "flex-end", padding: 4 }}>
                    <div style={{ width: "100%", height, background: "#111", borderRadius: 8 }} />
                  </div>
                  <div style={{ textAlign: "center", fontSize: 11, color: "#6b7280" }}>{month.label}</div>
                </div>
              )
            })}
          </div>
        </article>

        <article style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 14, background: "#fff" }}>
          <h3 style={{ margin: "0 0 12px" }}>Recent Orders</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {data.recentOrders.length === 0 && <p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>No recent orders.</p>}
            {data.recentOrders.map((order) => (
              <div key={order.id} style={{ border: "1px solid #f3f4f6", borderRadius: 10, padding: 10 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>#{order.orderNumber}</p>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b7280" }}>
                  AED {order.total.toLocaleString()} · {order.status}
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "#9ca3af" }}>{new Date(order.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  )
}
