"use client";

import Link from "next/link";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications, type AppNotification } from "./notification-store";

function formatNotificationTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  });
}

function NotificationContent({
  notification,
}: {
  notification: AppNotification;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">
          {notification.title}
        </p>
        {!notification.read ? (
          <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
        ) : null}
      </div>
      {notification.message ? (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {notification.message}
        </p>
      ) : null}
      <p className="mt-2 text-[0.7rem] text-muted-foreground">
        {formatNotificationTime(notification.createdAt)}
      </p>
    </div>
  );
}

export function NotificationBell() {
  const {
    clearNotifications,
    markAllAsRead,
    markAsRead,
    notifications,
    unreadCount,
  } = useNotifications();

  const recentNotifications = notifications.slice(0, 8);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="Thông báo"
          className="relative"
          size="icon"
          type="button"
          variant="outline"
        >
          <Bell className="size-4" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[0.65rem] font-bold text-primary-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="max-h-[75vh] w-[calc(100vw-2rem)] overflow-y-auto p-2 sm:w-96"
      >
        <div className="flex items-center justify-between gap-2 px-2 py-2">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Thông báo
            </h2>
            <p className="text-xs text-muted-foreground">
              {unreadCount} thông báo chưa đọc
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              aria-label="Đánh dấu đã đọc"
              disabled={notifications.length === 0}
              onClick={markAllAsRead}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <CheckCheck className="size-4" />
            </Button>
            <Button
              aria-label="Xóa thông báo"
              disabled={notifications.length === 0}
              onClick={clearNotifications}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>

        <DropdownMenuSeparator />

        {recentNotifications.length === 0 ? (
          <div className="px-2 py-8 text-center text-sm text-muted-foreground">
            Chưa có thông báo.
          </div>
        ) : null}

        {recentNotifications.map((notification) => {
          const content = <NotificationContent notification={notification} />;

          if (notification.actionHref) {
            return (
              <DropdownMenuItem asChild key={notification.id}>
                <Link
                  className="cursor-pointer rounded-lg p-3"
                  href={notification.actionHref}
                  onClick={() => markAsRead(notification.id)}
                >
                  {content}
                </Link>
              </DropdownMenuItem>
            );
          }

          return (
            <DropdownMenuItem
              className="cursor-pointer rounded-lg p-3"
              key={notification.id}
              onClick={() => markAsRead(notification.id)}
            >
              {content}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
