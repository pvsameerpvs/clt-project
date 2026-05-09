const ORDER_VIBRATION_PATTERN = [
  800, 250, 800, 250, 800, 250, 800, 250, 800, 250,
  800, 250, 800, 250, 800, 250, 800, 250, 550,
]

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener("push", (event) => {
  const fallback = {
    title: "New order",
    body: "A new order is waiting in the admin dashboard.",
    url: "/dashboard/mobile-order-app",
  }

  let payload = fallback
  if (event.data) {
    try {
      payload = { ...fallback, ...event.data.json() }
    } catch {
      payload = { ...fallback, body: event.data.text() || fallback.body }
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || fallback.title, {
      body: payload.body || fallback.body,
      icon: "/admin-icon.png",
      badge: "/admin-maskable-icon.png",
      tag: payload.tag || "cle-admin-order",
      data: {
        url: payload.url || fallback.url,
        appUrl: "/dashboard/mobile-order-app",
      },
      renotify: true,
      requireInteraction: true,
      silent: false,
      timestamp: Date.now(),
      vibrate: ORDER_VIBRATION_PATTERN,
      actions: [
        { action: "see-order", title: "See Order" },
        { action: "open-app", title: "Open App" },
      ],
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const notificationData = event.notification.data || {}
  const path = event.action === "open-app" ? notificationData.appUrl : notificationData.url
  const targetUrl = new URL(path || "/dashboard/mobile-order-app", self.location.origin).href

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clients) => {
      for (const client of clients) {
        if ("focus" in client && client.url.startsWith(self.location.origin)) {
          if ("navigate" in client) {
            await client.navigate(targetUrl)
          }
          return client.focus()
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }

      return undefined
    })
  )
})
