"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AppNotification = {
  id: string;
  type: "success" | "info" | "warning" | "error";
  title: string;
  message?: string;
  createdAt: string;
  read: boolean;
  actionHref?: string;
};

type AddNotificationInput = Omit<
  AppNotification,
  "createdAt" | "id" | "read"
> & {
  id?: string;
};

type NotificationContextValue = {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notification: AddNotificationInput) => AppNotification;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  visibleToasts: AppNotification[];
  dismissToast: (id: string) => void;
};

const STORAGE_KEY = "qrfood_notifications";
const MAX_NOTIFICATIONS = 50;
const MAX_VISIBLE_TOASTS = 3;

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);

function createNotificationId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isNotificationType(value: unknown): value is AppNotification["type"] {
  return (
    value === "success" ||
    value === "info" ||
    value === "warning" ||
    value === "error"
  );
}

function isAppNotification(value: unknown): value is AppNotification {
  if (!value || typeof value !== "object") {
    return false;
  }

  const notification = value as Record<string, unknown>;
  return (
    typeof notification.id === "string" &&
    isNotificationType(notification.type) &&
    typeof notification.title === "string" &&
    typeof notification.createdAt === "string" &&
    typeof notification.read === "boolean" &&
    (notification.message === undefined ||
      typeof notification.message === "string") &&
    (notification.actionHref === undefined ||
      typeof notification.actionHref === "string")
  );
}

function readStoredNotifications() {
  if (typeof window === "undefined") {
    return [];
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    if (!Array.isArray(parsed)) {
      window.localStorage.removeItem(STORAGE_KEY);
      return [];
    }

    return parsed.filter(isAppNotification).slice(0, MAX_NOTIFICATIONS);
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [toastIds, setToastIds] = useState<string[]>([]);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setNotifications(readStoredNotifications());
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(notifications.slice(0, MAX_NOTIFICATIONS)),
    );
  }, [hasHydrated, notifications]);

  const addNotification = useCallback(
    (input: AddNotificationInput) => {
      const notification: AppNotification = {
        ...input,
        createdAt: new Date().toISOString(),
        id: input.id ?? createNotificationId(),
        read: false,
      };

      setNotifications((current) => [
        notification,
        ...current.filter((item) => item.id !== notification.id),
      ].slice(0, MAX_NOTIFICATIONS));
      setToastIds((current) => [
        notification.id,
        ...current.filter((id) => id !== notification.id),
      ].slice(0, MAX_VISIBLE_TOASTS));

      return notification;
    },
    [],
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, read: true })),
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setToastIds([]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToastIds((current) => current.filter((toastId) => toastId !== id));
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const visibleToasts = useMemo(
    () =>
      toastIds
        .map((id) => notifications.find((notification) => notification.id === id))
        .filter((notification): notification is AppNotification =>
          Boolean(notification),
        ),
    [notifications, toastIds],
  );

  const value = useMemo<NotificationContextValue>(
    () => ({
      addNotification,
      clearNotifications,
      dismissToast,
      markAllAsRead,
      markAsRead,
      notifications,
      unreadCount,
      visibleToasts,
    }),
    [
      addNotification,
      clearNotifications,
      dismissToast,
      markAllAsRead,
      markAsRead,
      notifications,
      unreadCount,
      visibleToasts,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used inside NotificationProvider");
  }

  return context;
}
