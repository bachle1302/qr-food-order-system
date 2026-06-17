import type { OrderStatus } from "../types";
import { ORDER_STATUS_LABELS } from "../lib/order-ui";

type OrderStatusBadgeProps = {
  status: OrderStatus;
};

const badgeClasses: Record<OrderStatus, string> = {
  NEW: "border-primary/20 bg-primary/10 text-foreground",
  CONFIRMED: "border-blue-400/30 bg-blue-400/10 text-blue-200",
  PREPARING: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  READY: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  SERVED: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
  PAID: "border-violet-400/30 bg-violet-400/10 text-violet-200",
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
