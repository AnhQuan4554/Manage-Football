/* Imported by the existing next-pwa worker. Never register a second worker. */
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data?.json() || {};
  } catch {
    // Always show a visible notification, even for malformed/empty messages.
  }
  event.waitUntil(
    self.registration.showNotification(payload.title || "Pinkstorm FC", {
      body: payload.body || "Bạn có thông báo mới từ đội bóng.",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      tag: payload.tag || "pinkstorm-notification",
      data: { url: payload.url || "/notifications" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  let target = new URL("/notifications", self.location.origin);
  try {
    const candidate = new URL(event.notification.data?.url || target.href, self.location.origin);
    if (candidate.origin === self.location.origin) target = candidate;
  } catch {
    // Ignore malformed or external destinations.
  }
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (windows) => {
      const existing = windows.find((client) => client.url === target.href);
      if (existing) return existing.focus();
      return self.clients.openWindow(target.href);
    }),
  );
});
