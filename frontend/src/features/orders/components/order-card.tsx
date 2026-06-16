import { Button } from "@/components/ui/button";
import type { Order, OrderStatus } from "../types";

type OrderCardProps = {
  order: Order;
  actions?: OrderStatus[];
  isUpdating?: boolean;
  onUpdateStatus?: (orderId: string, status: OrderStatus) => void;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("vi-VN");
}

export function OrderCard({
  order,
  actions = [],
  isUpdating,
  onUpdateStatus,
}: OrderCardProps) {
  return (
    <article className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Order #{order.id}</p>
          <h3 className="mt-1 font-semibold text-foreground">
            Table ID: {order.tableId}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDate(order.createdAt)}
          </p>
        </div>
        <span className="w-fit rounded-md border border-border bg-muted px-2 py-1 text-xs font-medium text-foreground">
          {order.status}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {order.items.map((item, index) => (
          <div
            className="rounded-md border border-border bg-background p-3 text-sm"
            key={`${order.id}-${item.dishId}-${index}`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-foreground">
                Dish ID: {item.dishId}
              </span>
              <span className="text-muted-foreground">x{item.quantity}</span>
            </div>
            <p className="mt-1 text-muted-foreground">
              {formatCurrency(item.pricePerUnit)}
            </p>
            {item.note ? (
              <p className="mt-1 text-muted-foreground">Note: {item.note}</p>
            ) : null}
          </div>
        ))}
      </div>

      {order.note ? (
        <p className="mt-4 text-sm text-muted-foreground">Order note: {order.note}</p>
      ) : null}

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <span className="text-sm text-muted-foreground">Final price</span>
        <span className="font-semibold text-foreground">
          {formatCurrency(order.finalPrice ?? order.totalPrice)}
        </span>
      </div>

      {actions.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {actions.map((status) => (
            <Button
              disabled={isUpdating}
              key={status}
              onClick={() => onUpdateStatus?.(order.id, status)}
              size="sm"
              variant={status === "CANCELLED" ? "destructive" : "outline"}
            >
              {status}
            </Button>
          ))}
        </div>
      ) : null}
    </article>
  );
}
