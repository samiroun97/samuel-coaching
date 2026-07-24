// Service worker minimal : uniquement pour recevoir et afficher les
// notifications push (rappels repas). Pas de cache offline ici.

self.addEventListener("push", (event) => {
  let data = { title: "Samuel Coaching", body: "N'oublie pas de logguer ta journée !" };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch { /* garde les valeurs par défaut */ }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: data.url || "/dashboard/nutrition" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard/nutrition";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      const existing = clientsArr.find((c) => c.url.includes(url));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    })
  );
});
