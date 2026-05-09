"use client"

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

export type NotificationState = NotificationPermission | "unsupported"
type ActionNotificationOptions = NotificationOptions & {
  actions?: Array<{ action: string; title: string }>
  renotify?: boolean
  silent?: boolean
  timestamp?: number
  vibrate?: VibratePattern
}

export const ORDER_SOUND_STORAGE_KEY = "cle-admin-order-sound"
export const ORDER_ALERT_DURATION_MS = 10000
export const ORDER_VIBRATION_PATTERN: VibratePattern = [
  800, 250, 800, 250, 800, 250, 800, 250, 800, 250,
  800, 250, 800, 250, 800, 250, 800, 250, 550,
]

export function isStandaloneDisplay() {
  if (typeof window === "undefined") return false
  const standaloneNavigator = window.navigator as Navigator & { standalone?: boolean }
  return window.matchMedia?.("(display-mode: standalone)").matches || standaloneNavigator.standalone === true
}

export function getNotificationState(): NotificationState {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported"
  return Notification.permission
}

export function isOrderSoundReady() {
  if (typeof window === "undefined") return false
  try {
    return window.localStorage.getItem(ORDER_SOUND_STORAGE_KEY) === "ready"
  } catch {
    return false
  }
}

export function markOrderSoundReady() {
  try {
    window.localStorage.setItem(ORDER_SOUND_STORAGE_KEY, "ready")
  } catch {
    // Storage can be unavailable in private browsing or locked-down admin devices.
  }
}

export function isWebPushSupported() {
  return (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    window.isSecureContext &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  )
}

export async function registerOrderWorker() {
  if (
    typeof window === "undefined" ||
    typeof navigator === "undefined" ||
    !window.isSecureContext ||
    !("serviceWorker" in navigator)
  ) {
    return null
  }

  await navigator.serviceWorker.register("/sw.js", { scope: "/" })
  return navigator.serviceWorker.ready
}

export async function requestNotificationPermission(): Promise<NotificationState> {
  const state = getNotificationState()
  if (state !== "default") return state

  return Notification.requestPermission()
}

export function vibrateOrderAlert() {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return false
  return navigator.vibrate(ORDER_VIBRATION_PATTERN)
}

export async function playOrderChime(durationMs = ORDER_ALERT_DURATION_MS) {
  const AudioContextCtor =
    window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

  if (!AudioContextCtor) {
    throw new Error("Audio is not supported in this browser.")
  }

  const audioContext = new AudioContextCtor()
  await audioContext.resume()

  const now = audioContext.currentTime
  const tones = [
    { frequency: 740, startsAt: 0 },
    { frequency: 932, startsAt: 0.16 },
    { frequency: 1175, startsAt: 0.32 },
  ]
  const repeatEverySeconds = 1.2
  const durationSeconds = Math.max(durationMs, ORDER_ALERT_DURATION_MS) / 1000

  for (let loopStartsAt = 0; loopStartsAt < durationSeconds; loopStartsAt += repeatEverySeconds) {
    const gain = audioContext.createGain()
    gain.gain.setValueAtTime(0.0001, now + loopStartsAt)
    gain.gain.exponentialRampToValueAtTime(0.22, now + loopStartsAt + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + loopStartsAt + 0.9)
    gain.connect(audioContext.destination)

    tones.forEach(({ frequency, startsAt }) => {
      const toneStartsAt = loopStartsAt + startsAt
      if (toneStartsAt >= durationSeconds) return

      const oscillator = audioContext.createOscillator()
      oscillator.type = "sine"
      oscillator.frequency.setValueAtTime(frequency, now + toneStartsAt)
      oscillator.connect(gain)
      oscillator.start(now + toneStartsAt)
      oscillator.stop(now + Math.min(toneStartsAt + 0.32, durationSeconds))
    })
  }

  window.setTimeout(() => {
    void audioContext.close()
  }, durationSeconds * 1000 + 500)
}

export async function showOrderNotification({
  body,
  tag,
  title,
  url,
}: {
  body: string
  tag: string
  title: string
  url: string
}) {
  if (getNotificationState() !== "granted") return

  const registration = await registerOrderWorker()
  const options: ActionNotificationOptions = {
    body,
    icon: "/admin-icon.png",
    badge: "/admin-maskable-icon.png",
    tag,
    data: { url },
    renotify: true,
    requireInteraction: true,
    silent: false,
    timestamp: Date.now(),
    vibrate: ORDER_VIBRATION_PATTERN,
    actions: [
      { action: "see-order", title: "See Order" },
      { action: "open-app", title: "Open App" },
    ],
  }

  await registration?.showNotification(title, options)
}

export async function subscribeToWebPush(vapidPublicKey: string) {
  if (!isWebPushSupported()) {
    throw new Error("Push notifications are not supported in this browser.")
  }

  const registration = await navigator.serviceWorker.ready
  const existingSubscription = await registration.pushManager.getSubscription()

  if (existingSubscription) {
    await savePushSubscription(existingSubscription)
    return existingSubscription
  }

  // Convert VAPID key to Uint8Array
  const padding = "=".repeat((4 - (vapidPublicKey.length % 4)) % 4)
  const base64 = (vapidPublicKey + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: outputArray,
  })

  await savePushSubscription(subscription)
  return subscription
}

async function savePushSubscription(subscription: PushSubscription) {
  const res = await fetch("/api/admin/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription }),
  })

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string; details?: string } | null
    throw new Error(data?.details || data?.error || "Failed to save push subscription.")
  }
}

export async function sendTestWebPush() {
  const res = await fetch("/api/admin/push/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  })
  const data = (await res.json().catch(() => null)) as
    | { error?: string; delivered?: number; subscriptions?: number; failed?: number }
    | null

  if (!res.ok) {
    throw new Error(data?.error || "Unable to send test push.")
  }

  return {
    delivered: data?.delivered || 0,
    subscriptions: data?.subscriptions || 0,
    failed: data?.failed || 0,
  }
}
