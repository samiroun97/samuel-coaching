import { apiPost } from "@/lib/apiClient";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function isPushSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
}

export async function subscribeToPush() {
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) throw new Error("Configuration notifications manquante.");

  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Autorisation refusée — active les notifications dans les réglages de ton navigateur.");

  const existing = await reg.pushManager.getSubscription();
  const sub = existing ?? await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });

  const json = sub.toJSON();
  const res = await apiPost("/api/push/subscribe", {
    endpoint: json.endpoint, p256dh: json.keys?.p256dh, auth: json.keys?.auth,
  });
  if (!res.ok) throw new Error("Erreur lors de l'enregistrement de l'abonnement.");
}

export async function unsubscribeFromPush() {
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    await apiPost("/api/push/unsubscribe", { endpoint: sub.endpoint });
    await sub.unsubscribe();
  }
}
