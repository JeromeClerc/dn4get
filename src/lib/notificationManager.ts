import { NotificationItem } from '../types';

const ALERTED_STORAGE_KEY = 'dn4get_alerted_notifs_v1';

function getAlertedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(ALERTED_STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function markAlertedId(id: string): void {
  try {
    const set = getAlertedIds();
    set.add(id);
    // Keep only the last 200 ids to avoid unbounded storage
    const arr = Array.from(set).slice(-200);
    localStorage.setItem(ALERTED_STORAGE_KEY, JSON.stringify(arr));
  } catch {
    // Ignore storage errors
  }
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getBrowserNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (e) {
    console.error('Erreur lors de la demande de permission de notification:', e);
    return Notification.permission;
  }
}

export async function showBrowserNotification(
  title: string,
  body: string,
  options?: { tag?: string; activityId?: string }
): Promise<boolean> {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    // Préférer le Service Worker (requis sur Android PWA et plus fiable sur Desktop)
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && 'showNotification' in registration) {
        await registration.showNotification(title, {
          body,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: options?.tag || 'dn4get-due-notif',
          data: { activityId: options?.activityId },
        });
        return true;
      }
    }

    // Fallback API Notification classique du navigateur
    new Notification(title, {
      body,
      icon: '/pwa-192x192.png',
      tag: options?.tag || 'dn4get-due-notif',
    });
    return true;
  } catch (e) {
    console.error('Erreur affichage notification système:', e);
    return false;
  }
}

export function triggerAlertForNewNotifications(
  notifications: NotificationItem[],
  onToast?: (notif: NotificationItem) => void
): void {
  const alerted = getAlertedIds();
  const unread = notifications.filter((n) => !n.is_read);

  for (const notif of unread) {
    if (!alerted.has(notif.id)) {
      markAlertedId(notif.id);
      // Déclencher la notification système (navigateur / mobile)
      showBrowserNotification(notif.title, notif.message, {
        tag: `notif-${notif.id}`,
        activityId: notif.activity_id,
      });
      // Déclencher le toast visuel dans l'application
      if (onToast) {
        onToast(notif);
      }
    }
  }
}

