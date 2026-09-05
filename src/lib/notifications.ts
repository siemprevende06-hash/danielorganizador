export const POMODORO_NOTIFICATION_TAG = 'pomodoro-status';
export const ROUTINE_NOTIFICATION_TAG = 'routine-block';

export const NOTIFICATIONS_ENABLED_KEY = 'notificationsEnabled_v1';

function notificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}

export function areNotificationsEnabled(): boolean {
  try {
    return localStorage.getItem(NOTIFICATIONS_ENABLED_KEY) !== 'false';
  } catch {
    return true;
  }
}

export function setNotificationsEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch {}
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!notificationSupported()) return 'unsupported';
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!notificationSupported() || Notification.permission !== 'granted') return null;
  if (!areNotificationsEnabled()) return null;
  try {
    const registration = await navigator.serviceWorker.ready;
    return registration || null;
  } catch {
    return null;
  }
}

export interface PwaNotificationOptions {
  title: string;
  body: string;
  tag: string;
  icon?: string;
  badge?: string;
}

export async function updateNotification(options: PwaNotificationOptions, extra?: NotificationOptions): Promise<void> {
  const registration = await getRegistration();
  if (!registration) return;
  try {
    await registration.showNotification(options.title, {
      body: options.body,
      tag: options.tag,
      icon: options.icon || '/pwa-192x192.png',
      badge: options.badge || '/pwa-192x192.png',
      silent: true,
      requireInteraction: true,
      ...extra,
    });
  } catch {}
}

export async function closeNotification(tag: string): Promise<void> {
  if (!notificationSupported() || Notification.permission !== 'granted') return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const notifications = await registration.getNotifications({ tag });
    notifications.forEach(n => n.close());
  } catch {}
}

export async function closeAllAppNotifications(): Promise<void> {
  await closeNotification(POMODORO_NOTIFICATION_TAG);
  await closeNotification(ROUTINE_NOTIFICATION_TAG);
}

export function formatRemaining(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}