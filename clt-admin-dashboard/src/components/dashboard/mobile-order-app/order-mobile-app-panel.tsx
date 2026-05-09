"use client"

import { useEffect, useMemo, useState } from "react"
import { Bell, Download, Smartphone, Volume2 } from "lucide-react"
import {
  BeforeInstallPromptEvent,
  getNotificationState,
  isOrderSoundReady,
  isStandaloneDisplay,
  markOrderSoundReady,
  NotificationState,
  playOrderChime,
  registerOrderWorker,
  requestNotificationPermission,
  showOrderNotification,
  vibrateOrderAlert,
} from "@/lib/order-alerts"

interface OrderMobileAppPanelProps {
  openOrders: number
  totalOrders: number
}

type InstallGuide = "ios" | "android" | "browser"

function getNotificationLabel(state: NotificationState) {
  if (state === "granted") return "On"
  if (state === "denied") return "Blocked"
  if (state === "unsupported") return "Unavailable"
  return "Off"
}

function getNotificationTone(state: NotificationState) {
  if (state === "granted") return "ready"
  if (state === "denied" || state === "unsupported") return "blocked"
  return "idle"
}

function getInstallGuide(): InstallGuide {
  const userAgent = window.navigator.userAgent.toLowerCase()
  const isIos = /iphone|ipad|ipod/.test(userAgent)
  const isAndroid = userAgent.includes("android")

  if (isIos) return "ios"
  if (isAndroid) return "android"
  return "browser"
}

function getInstallSteps(guide: InstallGuide) {
  if (guide === "ios") {
    return ["Open this page in Safari.", "Tap Share.", "Choose Add to Home Screen."]
  }

  if (guide === "android") {
    return ["Open this page in Chrome.", "Tap the browser menu.", "Choose Install app or Add to Home screen."]
  }

  return ["Open this page in Chrome or Edge.", "Use the browser menu.", "Choose Install app when available."]
}

export function OrderMobileAppPanel({ openOrders, totalOrders }: OrderMobileAppPanelProps) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installGuide, setInstallGuide] = useState<InstallGuide | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [notificationState, setNotificationState] = useState<NotificationState>("default")
  const [soundReady, setSoundReady] = useState(false)
  const [workerReady, setWorkerReady] = useState(false)
  const [message, setMessage] = useState("Install on mobile, then enable alerts for the order desk.")

  useEffect(() => {
    const initializePanelState = window.setTimeout(() => {
      setIsInstalled(isStandaloneDisplay())
      setNotificationState(getNotificationState())
      setSoundReady(isOrderSoundReady())
    }, 0)

    void registerOrderWorker()
      .then((registration) => setWorkerReady(Boolean(registration)))
      .catch(() => setWorkerReady(false))

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
      setInstallGuide(null)
      setMessage("Install is ready on this browser.")
    }

    function handleAppInstalled() {
      setIsInstalled(true)
      setInstallPrompt(null)
      setMessage("Admin app installed.")
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.clearTimeout(initializePanelState)
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const installLabel = useMemo(() => {
    if (isInstalled) return "Installed"
    if (installPrompt) return "Ready"
    return "Manual"
  }, [installPrompt, isInstalled])

  const installButtonLabel = installPrompt ? "Install Admin App" : "Show Install Steps"

  async function handleInstallClick() {
    if (isInstalled) {
      setMessage("Admin app is already installed.")
      return
    }

    if (!installPrompt) {
      const guide = getInstallGuide()
      setInstallGuide(guide)
      setMessage("This browser needs manual install from its menu.")
      return
    }

    const prompt = installPrompt
    setInstallPrompt(null)
    await prompt.prompt()
    const choice = await prompt.userChoice

    if (choice.outcome === "accepted") {
      setIsInstalled(true)
      setMessage("Admin app installed.")
    } else {
      setMessage("Install was dismissed. You can try again from the browser menu.")
    }
  }

  async function handleEnableAlerts() {
    try {
      const registration = await registerOrderWorker()
      setWorkerReady(Boolean(registration))

      const permission = await requestNotificationPermission()
      setNotificationState(permission)
      vibrateOrderAlert()
      await playOrderChime()
      markOrderSoundReady()
      setSoundReady(true)

      if (permission === "granted") {
        setMessage("Order alerts are ready with 10-second sound and vibration where supported.")
      } else if (permission === "denied") {
        setMessage("Browser notifications are blocked. Sound and vibration are ready while this page is open.")
      } else {
        setMessage("Sound and vibration are ready while this page is open.")
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to enable alerts on this browser.")
    }
  }

  async function handleTestSound() {
    try {
      vibrateOrderAlert()
      await playOrderChime()
      markOrderSoundReady()
      setSoundReady(true)

      await showOrderNotification({
        title: "Order alerts ready",
        body: "New order notifications will open the order desk.",
        tag: "cle-admin-alert-test",
        url: "/dashboard/mobile-order-app",
      })

      setMessage("10-second test alert played.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to play test sound.")
    }
  }

  return (
    <aside className="order-app-panel" aria-label="Mobile order app controls">
      <div className="panel-heading">
        <span className="panel-icon" aria-hidden="true">
          <Smartphone size={20} strokeWidth={2.4} />
        </span>
        <div>
          <p>Mobile order app</p>
          <h2>Order desk</h2>
        </div>
      </div>

      <div className="metric-grid">
        <div>
          <span>Open</span>
          <strong>{openOrders}</strong>
        </div>
        <div>
          <span>Today</span>
          <strong>{totalOrders}</strong>
        </div>
      </div>

      <div className="status-grid">
        <div>
          <span>Install</span>
          <strong className={isInstalled ? "ready" : "idle"}>{installLabel}</strong>
        </div>
        <div>
          <span>Notify</span>
          <strong className={getNotificationTone(notificationState)}>{getNotificationLabel(notificationState)}</strong>
        </div>
        <div>
          <span>Sound</span>
          <strong className={soundReady ? "ready" : "idle"}>{soundReady ? "Ready" : "Off"}</strong>
        </div>
        <div>
          <span>Worker</span>
          <strong className={workerReady ? "ready" : "idle"}>{workerReady ? "Ready" : "Off"}</strong>
        </div>
      </div>

      <div className="action-stack">
        <button type="button" className="primary-action" onClick={handleInstallClick}>
          <Download size={16} strokeWidth={2.4} />
          <span>{installButtonLabel}</span>
        </button>
        {installGuide && (
          <div className="install-guide" role="status" aria-live="polite">
            <strong>{installGuide === "ios" ? "Install on iPhone" : "Manual install"}</strong>
            <ol>
              {getInstallSteps(installGuide).map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        )}
        <button type="button" className="secondary-action" onClick={handleEnableAlerts}>
          <Bell size={16} strokeWidth={2.4} />
          <span>Enable Order Alerts</span>
        </button>
        <button type="button" className="secondary-action" onClick={handleTestSound}>
          <Volume2 size={16} strokeWidth={2.4} />
          <span>Test Sound</span>
        </button>
      </div>

      <p className="panel-note" aria-live="polite">
        {message}
      </p>

      <style jsx>{`
        .order-app-panel {
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          background: #fff;
          padding: 14px;
          display: grid;
          gap: 14px;
        }
        .panel-heading {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .panel-icon {
          display: inline-flex;
          width: 40px;
          height: 40px;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: #111827;
          color: #fff;
          flex: none;
        }
        .panel-heading p,
        .metric-grid span,
        .status-grid span {
          margin: 0;
          color: #6b7280;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .panel-heading h2 {
          margin: 2px 0 0;
          font-size: 20px;
          letter-spacing: 0;
        }
        .metric-grid,
        .status-grid {
          display: grid;
          gap: 8px;
        }
        .metric-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .metric-grid div,
        .status-grid div {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #f9fafb;
        }
        .metric-grid div {
          padding: 12px;
        }
        .metric-grid strong {
          display: block;
          margin-top: 4px;
          font-size: 24px;
          letter-spacing: 0;
          color: #111827;
        }
        .status-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .status-grid div {
          padding: 10px;
        }
        .status-grid strong {
          display: block;
          margin-top: 4px;
          font-size: 13px;
        }
        .status-grid strong.ready {
          color: #047857;
        }
        .status-grid strong.blocked {
          color: #b91c1c;
        }
        .status-grid strong.idle {
          color: #4b5563;
        }
        .action-stack {
          display: grid;
          gap: 8px;
        }
        .install-guide {
          border: 1px solid #d1d5db;
          border-radius: 12px;
          background: #f9fafb;
          padding: 12px;
          color: #111827;
        }
        .install-guide strong {
          display: block;
          font-size: 13px;
          font-weight: 900;
        }
        .install-guide ol {
          margin: 8px 0 0;
          padding-left: 18px;
          color: #4b5563;
          font-size: 12px;
          line-height: 1.55;
        }
        .primary-action,
        .secondary-action {
          display: inline-flex;
          min-height: 42px;
          width: 100%;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 10px;
          padding: 9px 12px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
        }
        .primary-action {
          border: 1px solid #111827;
          background: #111827;
          color: #fff;
        }
        .secondary-action {
          border: 1px solid #d1d5db;
          background: #fff;
          color: #111827;
        }
        .primary-action:hover {
          background: #030712;
        }
        .secondary-action:hover {
          border-color: #111827;
        }
        .panel-note {
          margin: 0;
          color: #6b7280;
          font-size: 12px;
          line-height: 1.5;
        }
      `}</style>
    </aside>
  )
}
