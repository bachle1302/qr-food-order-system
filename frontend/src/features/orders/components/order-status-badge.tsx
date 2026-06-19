import type { OrderStatus } from "../types";
import { ORDER_STATUS_LABELS } from "../lib/order-ui";

type OrderStatusBadgeProps = {
  status: OrderStatus;
};

const badgeClasses: Record<OrderStatus, string> = {
  NEW: "border-primary/25 bg-primary/10 text-primary",
  CONFIRMED: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-200",
  PREPARING: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-200",
  READY: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
  SERVED: "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-200",
  PAID: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-200",
  COMPLETED: "border-muted-foreground/30 bg-muted text-foreground",
  CANCELLED: "border-destructive/30 bg-destructive/10 text-destructive",
};

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-md border px-2 py-1 text-xs font-medium ${badgeClasses[status]}`}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}
