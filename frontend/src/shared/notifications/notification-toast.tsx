"use client";

import { useEffect } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications, type AppNotification } from "./notification-store";

const TOAST_TIMEOUT_MS = 5000;

const iconByType: Record<AppNotification["type"], typeof Info> = {
  error: XCircle,
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
};

const toneByType: Record<AppNotification["type"], string> = {
  error: "border-destructive/40 bg-destructive/10 text-destructive",
  info: "border-primary/30 bg-primary/10 text-primary",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300",
};

function NotificationToastItem({
  notification,
}: {
  notification: AppNotification;
}) {
  const { dismissToast } = useNotifications();
  const Icon = iconByType[notification.type];

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      dismissToast(notification.id);
    }, TOAST_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [dismissToast, notification.id]);

  return (
    <article className="pointer-events-auto w-full rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xl shadow-black/10 backdrop-blur dark:shadow-black/30">
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border ${toneByType[notification.type]}`}
        >
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-foreground">
            {notification.title}
          </h2>
          {notification.message ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {notification.message}
            </p>
          ) : null}
        </div>
        <Button
          aria-label="Đóng thông báo"
          onClick={() => dismissToast(notification.id)}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <X className="size-4" />
        </Button>
      </div>
    </article>
  );
}

export function NotificationToast() {
  const { visibleToasts } = useNotifications();

  if (visibleToasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-3 top-3 z-[100] flex flex-col gap-2 sm:inset-x-auto sm:right-4 sm:top-4 sm:w-96">
      {visibleToasts.map((notification) => (
        <NotificationToastItem
          key={notification.id}
          notification={notification}
        />
      ))}
    </div>
  );
}
