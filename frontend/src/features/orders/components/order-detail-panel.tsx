import Image from "next/image";
import { ClipboardList } from "lucide-react";
import type { Order, OrderStatus } from "../types";
import {
  formatCurrency,
  formatDateTime,
  getDishLabel,
  getDishImageUrl,
  getCustomerLabel,
  getOrderItemCount,
  getOrderTotal,
  getTableLabel,
  type DishImageMap,
  type DishNameMap,
  type TableNameMap,
} from "../lib/order-ui";
import { OrderStatusActions } from "./order-status-actions";
import { OrderStatusBadge } from "./order-status-badge";

type OrderDetailPanelProps = {
  actions: OrderStatus[];
  isUpdating?: boolean;
  dishImageById?: DishImageMap;
  dishNameById?: DishNameMap;
  tableNameById?: TableNameMap;
  onUpdateStatus: (status: OrderStatus) => void;
  order: Order | null;
};

export function OrderDetailPanel({
  actions,
  dishImageById,
  dishNameById,
  tableNameById,
  isUpdating,
  onUpdateStatus,
  order,
}: OrderDetailPanelProps) {
  if (!order) {
    return (
      <aside className="h-fit border-y border-gray-200 py-5 dark:border-slate-800 text-card-foreground xl:sticky xl:top-4">
        <div className="grid min-h-72 place-items-center border-y border-dashed border-gray-200 py-6 text-center dark:border-slate-800">
          <div>
            <div className="mx-auto grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
              <ClipboardList className="size-5" />
            </div>
            <h2 className="mt-3 font-semibold text-foreground">
              Chọn một đơn
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Chọn order trong bảng để xem món, ghi chú và thao tác trạng thái.
            </p>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="h-fit border-y border-gray-200 text-foreground dark:border-slate-800 xl:sticky xl:top-4">
      <div className="border-b border-border p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Đơn hàng</p>
            <h2 className="mt-1 text-lg font-semibold text-foreground">
              {getTableLabel(order.tableId, tableNameById)}
            </h2>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="border-l-2 border-primary pl-3">
            <p className="text-muted-foreground">Khách hàng</p>
            <p className="mt-1 font-medium text-foreground">
              {getCustomerLabel(order)}
            </p>
            {order.customerPhone ? (
              <p className="mt-1 text-xs text-muted-foreground">
                SĐT: {order.customerPhone}
              </p>
            ) : null}
          </div>
          <div className="border-l-2 border-primary pl-3">
            <p className="text-muted-foreground">Tạo lúc</p>
            <p className="mt-1 font-medium text-foreground">
              {formatDateTime(order.createdAt)}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="space-y-3">
          {order.items.map((item, index) => {
            const imageUrl = item.dishImageUrl || getDishImageUrl(item.dishId, dishImageById);
            const name = item.dishName || getDishLabel(item.dishId, dishNameById);
            return (
              <div
                className="grid grid-cols-[1.5rem_3rem_1fr_auto] items-center gap-3 py-1"
                key={`${order.id}-${item.dishId}-${index}`}
              >
                <span className="text-sm text-muted-foreground">{index + 1}</span>
                <div className="relative size-12 overflow-hidden rounded-lg bg-orange-500/10 border border-orange-500/10 dark:border-orange-500/20">
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
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(item.pricePerUnit)} x {item.quantity}
                  </p>
                  {item.note ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Ghi chú: {item.note}
                    </p>
                  ) : null}
                </div>
                <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground">
                  x{item.quantity}
                </span>
              </div>
            );
          })}
        </div>

        {order.note ? (
          <div className="border-l-2 border-primary pl-3 text-sm">
            <p className="text-muted-foreground">Ghi chú đơn</p>
            <p className="mt-1 text-foreground">{order.note}</p>
          </div>
        ) : null}

        <div className="border-t border-border pt-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-foreground">
                Đơn chưa thanh toán
              </p>
              <p className="text-sm text-muted-foreground">
                {getOrderItemCount(order)} món
              </p>
            </div>
            <p className="text-lg font-semibold text-foreground">
              {formatCurrency(getOrderTotal(order))}
            </p>
          </div>
        </div>

        <div className="space-y-2 border-t border-border pt-4">
          <p className="text-sm font-medium text-foreground">
            Cập nhật trạng thái
          </p>
          <OrderStatusActions
            actions={actions}
            disabled={isUpdating}
            onSelect={onUpdateStatus}
          />
        </div>
      </div>
    </aside>
  );
}
