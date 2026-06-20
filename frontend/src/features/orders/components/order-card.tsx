import Image from "next/image";
import { Button } from "@/components/ui/button";
import type { Order, OrderStatus } from "../types";
import {
  formatCurrency,
  formatDateTime,
  getCustomerLabel,
  getDishLabel,
  getOrderTotal,
  getTableLabel,
  ORDER_STATUS_LABELS,
  type DishNameMap,
  type TableNameMap,
} from "../lib/order-ui";

type OrderCardProps = {
  order: Order;
  actions?: OrderStatus[];
  dishNameById?: DishNameMap;
  tableNameById?: TableNameMap;
  isUpdating?: boolean;
  onUpdateStatus?: (orderId: string, status: OrderStatus) => void;
};

export function OrderCard({
  order,
  actions = [],
  dishNameById,
  tableNameById,
  isUpdating,
  onUpdateStatus,
}: OrderCardProps) {
  return (
    <article className="border-y border-gray-200 py-5 dark:border-slate-800">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Đơn #{order.id}</p>
          <h3 className="mt-1 font-semibold text-foreground">
            {getTableLabel(order.tableId, tableNameById)}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDateTime(order.createdAt)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Khách:{" "}
            <span className="font-medium text-foreground">
              {getCustomerLabel(order)}
            </span>
          </p>
          {order.customerPhone ? (
            <p className="text-xs text-muted-foreground">
              SĐT: {order.customerPhone}
            </p>
          ) : null}
        </div>
        <span className="w-fit rounded-md border border-border bg-muted px-2 py-1 text-xs font-medium text-foreground">
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {order.items.map((item, index) => {
          const imageUrl = item.dishImageUrl;
          const name = item.dishName || getDishLabel(item.dishId, dishNameById);
          return (
            <div
              className="flex items-center gap-3 border-b border-gray-200 py-3 text-sm dark:border-slate-800"
              key={`${order.id}-${item.dishId}-${index}`}
            >
              <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-orange-500/10 border border-orange-500/10 dark:border-orange-500/20">
                {imageUrl ? (
                  <Image
                    alt={name}
                    className="size-full object-cover"
                    fill
                    sizes="48px"
                    src={imageUrl}
                    unoptimized
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-orange-600 dark:text-orange-300">
                    <span className="text-[10px] font-bold">Food</span>
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-foreground truncate">
                    {name}
                  </span>
                  <span className="text-muted-foreground shrink-0">x{item.quantity}</span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatCurrency(item.pricePerUnit)}
                </p>
                {item.note ? (
                  <p className="mt-1 text-xs text-muted-foreground">Ghi chú: {item.note}</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {order.note ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Ghi chú đơn: {order.note}
        </p>
      ) : null}

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <span className="text-sm text-muted-foreground">Tổng tiền</span>
        <span className="font-semibold text-foreground">
          {formatCurrency(getOrderTotal(order))}
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
              {ORDER_STATUS_LABELS[status]}
            </Button>
          ))}
        </div>
      ) : null}
    </article>
  );
}
