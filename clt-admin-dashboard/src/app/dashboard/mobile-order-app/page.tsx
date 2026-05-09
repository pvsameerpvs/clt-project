"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { BellRing, ExternalLink, RefreshCw, X } from "lucide-react"
import { AdminOrder, getAdminOrders } from "@/lib/admin-api"
import { OrderMobileAppPanel } from "@/components/dashboard/mobile-order-app/order-mobile-app-panel"
import { isOrderSoundReady, playOrderChime, showOrderNotification, vibrateOrderAlert } from "@/lib/order-alerts"

const INCOMING_STATUSES = new Set(["pending", "confirmed", "processing"])
const ORDER_POLL_INTERVAL_MS = 15000

function isIncomingOrder(order: AdminOrder) {
  return INCOMING_STATUSES.has(String(order.status || "").toLowerCase())
}

function getOrderLabel(order: AdminOrder) {
  return `#${order.order_number || order.id.slice(0, 8)}`
}

function getOrderUrl(order: AdminOrder) {
  return `/dashboard/orders/${encodeURIComponent(order.id)}`
}

function formatOrderTotal(order: AdminOrder) {
  return `AED ${Number(order.total || 0).toLocaleString()}`
}

export default function MobileOrderAppPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [alertOrder, setAlertOrder] = useState<AdminOrder | null>(null)
  const [alertTime, setAlertTime] = useState<string | null>(null)
  const knownOrderIdsRef = useRef<Set<string> | null>(null)
  const hasLoadedRef = useRef(false)

  const triggerIncomingAlert = useCallback(async (order: AdminOrder) => {
    setAlertOrder(order)
    setAlertTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))

    if (isOrderSoundReady()) {
      try {
        vibrateOrderAlert()
        await playOrderChime()
      } catch {
        // Browser audio can still be blocked if the device revokes autoplay permission.
      }
    }

    await showOrderNotification({
      title: `New order ${getOrderLabel(order)}`,
      body: `${formatOrderTotal(order)} is waiting for action.`,
      tag: `cle-admin-order-${order.id}`,
      url: getOrderUrl(order),
    })
  }, [])

  const loadOrders = useCallback(async () => {
    try {
      if (!hasLoadedRef.current) setLoading(true)
      setError(null)
      const todayOrders = await getAdminOrders({ scope: "today" })

      const knownOrderIds = knownOrderIdsRef.current
      const incomingOrders = todayOrders.filter(isIncomingOrder)

      if (knownOrderIds) {
        const newIncomingOrders = incomingOrders.filter((order) => !knownOrderIds.has(order.id))
        const latestNewOrder = newIncomingOrders.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]

        if (latestNewOrder) {
          void triggerIncomingAlert(latestNewOrder)
        }
      }

      knownOrderIdsRef.current = new Set(todayOrders.map((order) => order.id))
      setOrders(todayOrders)
      hasLoadedRef.current = true
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load mobile order app status.")
    } finally {
      setLoading(false)
    }
  }, [triggerIncomingAlert])

  useEffect(() => {
    loadOrders()
    const timer = window.setInterval(loadOrders, ORDER_POLL_INTERVAL_MS)
    return () => window.clearInterval(timer)
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

      {alertOrder && (
        <section className="incoming-popup" role="status" aria-live="assertive">
          <button className="close-popup" type="button" onClick={() => setAlertOrder(null)} aria-label="Dismiss alert">
            <X size={16} strokeWidth={2.4} />
          </button>
          <div className="popup-icon" aria-hidden="true">
            <BellRing size={22} strokeWidth={2.4} />
          </div>
          <div className="popup-copy">
            <p>New order received</p>
            <h2>{getOrderLabel(alertOrder)}</h2>
            <span>
              {formatOrderTotal(alertOrder)}
              {alertTime ? ` • ${alertTime}` : ""}
            </span>
          </div>
          <div className="popup-actions">
            <Link className="primary-popup-action" href={getOrderUrl(alertOrder)}>
              <ExternalLink size={16} strokeWidth={2.4} />
              <span>See Order</span>
            </Link>
            <Link className="secondary-popup-action" href="/dashboard/orders">
              Open Orders
            </Link>
          </div>
        </section>
      )}

      <section className="app-workspace">
        <OrderMobileAppPanel openOrders={stats.open} totalOrders={stats.total} />

        <div className="info-panel">
          <div>
            <p className="eyebrow">Order queue</p>
            <h2>{loading ? "Checking orders..." : `${stats.open} open today`}</h2>
          </div>
          <p className="description">
            Use this section only for mobile app install, alert permission, and sound testing. Order management remains
            in the normal Orders page.
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
        .incoming-popup {
          position: fixed;
          right: 24px;
          bottom: 24px;
          z-index: 40;
          width: min(380px, calc(100vw - 32px));
          border: 1px solid #d1fae5;
          border-radius: 16px;
          background: #ffffff;
          box-shadow: 0 24px 80px rgba(17, 24, 39, 0.18);
          padding: 16px;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          gap: 12px;
        }
        .close-popup {
          position: absolute;
          top: 10px;
          right: 10px;
          display: inline-flex;
          width: 30px;
          height: 30px;
          align-items: center;
          justify-content: center;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          background: #fff;
          color: #6b7280;
          cursor: pointer;
        }
        .popup-icon {
          display: inline-flex;
          width: 46px;
          height: 46px;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: #ecfdf5;
          color: #047857;
        }
        .popup-copy {
          min-width: 0;
          padding-right: 34px;
        }
        .popup-copy p {
          margin: 0;
          color: #047857;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .popup-copy h2 {
          margin: 4px 0 0;
          font-size: 22px;
          letter-spacing: 0;
        }
        .popup-copy span {
          display: block;
          margin-top: 4px;
          color: #6b7280;
          font-size: 13px;
          font-weight: 700;
        }
        .popup-actions {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .primary-popup-action,
        .secondary-popup-action {
          display: inline-flex;
          min-height: 42px;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 10px;
          padding: 9px 12px;
          font-size: 13px;
          font-weight: 800;
          text-decoration: none;
        }
        .primary-popup-action {
          border: 1px solid #111827;
          background: #111827;
          color: #fff;
        }
        .secondary-popup-action {
          border: 1px solid #d1d5db;
          background: #fff;
          color: #111827;
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
          .incoming-popup {
            right: 16px;
            bottom: 16px;
          }
          .popup-actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
