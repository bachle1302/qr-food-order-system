import { Clock3, MessageSquareText, ReceiptText } from "lucide-react";
import type { Order } from "../types";
import {
  formatCurrency,
  formatDateTime,
  getCustomerLabel,
  getDishLabel,
  getOrderItemCount,
  getOrderTotal,
  getTableLabel,
  type DishNameMap,
  type TableNameMap,
} from "../lib/order-ui";
import { OrderStatusBadge } from "./order-status-badge";

type MobileOrderCardProps = {
  dishNameById?: DishNameMap;
  isActive?: boolean;
  onSelect: () => void;
  order: Order;
  tableNameById?: TableNameMap;
};

function getShortOrderId(orderId: string) {
  return orderId.length > 6 ? orderId.slice(-6).toUpperCase() : orderId;
}

function getItemPreview(order: Order, dishNameById?: DishNameMap) {
  const firstItem = order.items[0];
  if (!firstItem) {
    return "Chưa có món";
  }

  const name = firstItem.dishName || getDishLabel(firstItem.dishId, dishNameById);
  if (order.items.length === 1) {
    return name;
  }

  return `${name} + ${order.items.length - 1} món khác`;
}

export function MobileOrderCard({
  dishNameById,
  isActive,
  onSelect,
  order,
  tableNameById,
}: MobileOrderCardProps) {
  const hasNote = Boolean(order.note?.trim());

  return (
    <button
      className={`w-full border-b border-border bg-background px-4 py-4 text-left transition active:bg-muted ${
        isActive ? "border-l-4 border-l-primary bg-primary/5" : "border-l-4 border-l-transparent"
      }`}
      onClick={onSelect}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <ReceiptText className="size-4 shrink-0 text-primary" />
            <p className="truncate text-base font-semibold text-foreground">
              #{getShortOrderId(order.id)}
            </p>
          </div>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            {getTableLabel(order.tableId, tableNameById)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-3 space-y-1.5">
        <p className="truncate text-sm text-foreground">
          Khách: {getCustomerLabel(order)}
        </p>
        <p className="truncate text-sm text-muted-foreground">
          {getItemPreview(order, dishNameById)}
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <Clock3 className="size-3.5 shrink-0" />
          <span className="truncate">{formatDateTime(order.createdAt)}</span>
          {hasNote ? <MessageSquareText className="size-3.5 shrink-0 text-primary" /> : null}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold text-foreground">
            {formatCurrency(getOrderTotal(order))}
          </p>
          <p className="text-xs text-muted-foreground">
            {getOrderItemCount(order)} món
          </p>
        </div>
      </div>
    </button>
  );
}
