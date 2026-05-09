"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { RefreshCw } from "lucide-react"
import { AdminOrder, getAdminOrders } from "@/lib/admin-api"
import { OrderMobileAppPanel } from "@/components/dashboard/mobile-order-app/order-mobile-app-panel"

const INCOMING_STATUSES = new Set(["pending", "confirmed", "processing"])

function isIncomingOrder(order: AdminOrder) {
  return INCOMING_STATUSES.has(String(order.status || "").toLowerCase())
}

export default function MobileOrderAppPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const todayOrders = await getAdminOrders({ scope: "today" })
      setOrders(todayOrders)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load mobile order app status.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const stats = useMemo(() => {
    const incoming = orders.filter(isIncomingOrder)
    return {
      total: orders.length,
      open: incoming.length,
    }
  }, [orders])

  return (
    <div className="mobile-order-app-page">
      <header className="page-header">
        <div>
          <h1>Mobile Order App</h1>
          <p>Install the admin app and enable order alerts for mobile order handling.</p>
        </div>
        <button className="ghost-btn" onClick={loadOrders} type="button">
          <RefreshCw size={16} strokeWidth={2.2} />
          <span>Refresh</span>
        </button>
      </header>

      {error && <div className="error-box">{error}</div>}

      <section className="app-workspace">
        <OrderMobileAppPanel openOrders={stats.open} totalOrders={stats.total} />

        <div className="info-panel">
          <div>
            <p className="eyebrow">Order queue</p>
            <h2>{loading ? "Checking orders..." : `${stats.open} open today`}</h2>
          </div>
          <p className="description">
            Use this section only for mobile app install, alert permission, and sound testing. Order management remains
            in the normal Orders page. Note: Global alerts are now enabled, so you will receive notifications across all dashboard pages automatically.
          </p>
          <Link className="orders-link" href="/dashboard/orders">
            Open Orders
          </Link>
        </div>
      </section>

      <style jsx>{`
        .mobile-order-app-page {
          display: grid;
          gap: 14px;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }
        .page-header h1 {
          margin: 0;
          font-size: 28px;
          letter-spacing: 0;
        }
        .page-header p {
          margin: 6px 0 0;
          color: #6b7280;
          font-size: 14px;
        }
        .ghost-btn,
        .orders-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 1px solid #d1d5db;
          background: #fff;
          border-radius: 10px;
          padding: 8px 12px;
          color: #111827;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          white-space: nowrap;
        }
        .ghost-btn:hover,
        .orders-link:hover {
          border-color: #111827;
        }
        .error-box {
          border: 1px solid #fecaca;
          background: #fef2f2;
          color: #b91c1c;
          border-radius: 12px;
          padding: 12px;
          font-size: 14px;
        }
        .app-workspace {
          display: grid;
          grid-template-columns: 360px minmax(0, 1fr);
          align-items: start;
          gap: 14px;
        }
        .info-panel {
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          background: #fff;
          padding: 18px;
          display: grid;
          gap: 14px;
        }
        .eyebrow {
          margin: 0;
          color: #6b7280;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .info-panel h2 {
          margin: 4px 0 0;
          font-size: 24px;
          letter-spacing: 0;
        }
        .description {
          margin: 0;
          max-width: 560px;
          color: #6b7280;
          font-size: 14px;
          line-height: 1.6;
        }
        .orders-link {
          width: fit-content;
        }
        @media (max-width: 920px) {
          .app-workspace {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 720px) {
          .page-header {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  )
}
