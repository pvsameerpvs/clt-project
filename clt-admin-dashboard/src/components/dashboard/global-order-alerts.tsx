"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { BellRing, ExternalLink, X } from "lucide-react"
import { AdminOrder, getAdminOrders } from "@/lib/admin-api"
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

export function GlobalOrderAlerts() {
  const [alertOrder, setAlertOrder] = useState<AdminOrder | null>(null)
  const [alertTime, setAlertTime] = useState<string | null>(null)
  const knownOrderIdsRef = useRef<Set<string> | null>(null)

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

  const pollOrders = useCallback(async () => {
    try {
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
    } catch {
      // Background poll failure should be silent
    }
  }, [triggerIncomingAlert])

  useEffect(() => {
    pollOrders()
    const timer = window.setInterval(pollOrders, ORDER_POLL_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [pollOrders])

  if (!alertOrder) return null

  return (
    <>
      <section className="global-incoming-popup" role="status" aria-live="assertive">
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
          <Link className="primary-popup-action" href={getOrderUrl(alertOrder)} onClick={() => setAlertOrder(null)}>
            <ExternalLink size={16} strokeWidth={2.4} />
            <span>See Order</span>
          </Link>
          <Link className="secondary-popup-action" href="/dashboard/orders" onClick={() => setAlertOrder(null)}>
            Open Orders
          </Link>
        </div>
      </section>

      <style jsx>{`
        .global-incoming-popup {
          position: fixed;
          right: 24px;
          bottom: 24px;
          z-index: 9999;
          width: min(380px, calc(100vw - 32px));
          border: 1px solid #d1fae5;
          border-radius: 16px;
          background: #ffffff;
          box-shadow: 0 24px 80px rgba(17, 24, 39, 0.18);
          padding: 16px;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          gap: 12px;
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
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
        @media (max-width: 720px) {
          .global-incoming-popup {
            right: 16px;
            bottom: 16px;
          }
          .popup-actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  )
}
