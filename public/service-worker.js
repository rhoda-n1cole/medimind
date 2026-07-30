self.addEventListener("push", (event) => {
  const payload = event.data ? event.data.json() : {};

  const options = {
    body: payload.body || "",
    data: { doseId: payload.doseId, actionToken: payload.actionToken },
  };

  if (payload.doseId) {
    options.actions = [
      { action: "confirm", title: "Mark as taken" },
      { action: "snooze", title: "Snooze 10 min" },
    ];
  }

  event.waitUntil(self.registration.showNotification(payload.title || "MediMind", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const { doseId, actionToken } = event.notification.data || {};

  if (event.action === "confirm" && doseId) {
    event.waitUntil(
      fetch(`/api/doses/${doseId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionToken }),
      })
    );
    return;
  }

  if (event.action === "snooze" && doseId) {
    event.waitUntil(
      fetch(`/api/doses/${doseId}/snooze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionToken }),
      })
    );
    return;
  }

  event.waitUntil(clients.openWindow("/dashboard.html"));
});