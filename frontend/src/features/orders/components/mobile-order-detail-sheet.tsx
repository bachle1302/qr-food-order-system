import Image from "next/image";
import {
  Clock3,
  MessageSquareText,
  Phone,
  ReceiptText,
  Table2,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Order, OrderStatus } from "../types";
import {
  formatCurrency,
  formatDateTime,
  getCustomerLabel,
  getDishImageUrl,
  getDishLabel,
  getOrderItemCount,
  getOrderTotal,
  getTableLabel,
  type DishImageMap,
  type DishNameMap,
  type TableNameMap,
} from "../lib/order-ui";
import { OrderStatusActions } from "./order-status-actions";
import { OrderStatusBadge } from "./order-status-badge";

type MobileOrderDetailSheetProps = {
  actions: OrderStatus[];
  dishImageById?: DishImageMap;
  dishNameById?: DishNameMap;
  isOpen: boolean;
  isUpdating?: boolean;
  onClose: () => void;
  onUpdateStatus: (status: OrderStatus) => void;
  order: Order | null;
  tableNameById?: TableNameMap;
};

function getShortOrderId(orderId: string) {
  return orderId.length > 8 ? orderId.slice(-8).toUpperCase() : orderId;
}

export function MobileOrderDetailSheet({
  actions,
  dishImageById,
  dishNameById,
  isOpen,
  isUpdating,
  onClose,
  onUpdateStatus,
  order,
  tableNameById,
}: MobileOrderDetailSheetProps) {
  if (!isOpen || !order) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        aria-label="Đóng chi tiết đơn"
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />
      <section className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-hidden rounded-t-2xl border border-border bg-background text-foreground shadow-2xl">
        <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-muted-foreground/30" />
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-4">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <ReceiptText className="size-4 text-primary" />
              Đơn #{getShortOrderId(order.id)}
            </p>
            <h2 className="mt-1 truncate text-xl font-semibold">
              {getTableLabel(order.tableId, tableNameById)}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <OrderStatusBadge status={order.status} />
            <Button
              aria-label="Đóng"
              onClick={onClose}
              size="icon"
              type="button"
              variant="ghost"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        <div className="max-h-[calc(85vh-5rem)] overflow-y-auto px-4 py-4">
          <div className="grid gap-3 border-b border-border pb-4 text-sm">
            <div className="flex items-start gap-3">
              <UserRound className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Khách hàng</p>
                <p className="font-medium text-foreground">{getCustomerLabel(order)}</p>
              </div>
            </div>
            {order.customerPhone ? (
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 size-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Số điện thoại</p>
                  <p className="font-medium text-foreground">{order.customerPhone}</p>
                </div>
              </div>
            ) : null}
            <div className="flex items-start gap-3">
              <Table2 className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Bàn</p>
                <p className="font-medium text-foreground">
                  {getTableLabel(order.tableId, tableNameById)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock3 className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Thời gian tạo</p>
                <p className="font-medium text-foreground">
                  {formatDateTime(order.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {order.note ? (
            <div className="mt-4 flex items-start gap-3 border-b border-border pb-4 text-sm">
              <MessageSquareText className="mt-0.5 size-4 text-primary" />
              <div>
                <p className="text-muted-foreground">Ghi chú đơn</p>
                <p className="mt-1 text-foreground">{order.note}</p>
              </div>
            </div>
          ) : null}

          <div className="mt-4 space-y-3">
            <p className="text-sm font-semibold text-foreground">Món trong đơn</p>
            <div className="divide-y divide-border border-y border-border">
              {order.items.map((item, index) => {
                const name = item.dishName || getDishLabel(item.dishId, dishNameById);
                const imageUrl = item.dishImageUrl || getDishImageUrl(item.dishId, dishImageById);
                return (
                  <div
                    className="grid grid-cols-[2rem_3.5rem_1fr_auto] items-center gap-3 py-3"
                    key={`${order.id}-${item.dishId}-${index}`}
                  >
                    <span className="text-sm text-muted-foreground">{index + 1}</span>
                    <div className="size-14 overflow-hidden rounded-xl border border-orange-500/10 bg-orange-500/10 dark:border-orange-500/20">
                      {imageUrl ? (
                        <div className="relative size-full">
                          <Image
                            alt={name}
                            className="object-cover"
                            fill
                            sizes="56px"
                            src={imageUrl}
                            unoptimized
                          />
                        </div>
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
                    <span className="h-fit rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground">
                      x{item.quantity}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex items-start justify-between gap-4 border-b border-border pb-4">
            <div>
              <p className="font-semibold text-foreground">Tổng đơn</p>
              <p className="text-sm text-muted-foreground">
                {getOrderItemCount(order)} món
              </p>
            </div>
            <p className="text-lg font-semibold text-foreground">
              {formatCurrency(getOrderTotal(order))}
            </p>
          </div>

          <div className="space-y-3 py-4">
            <p className="text-sm font-semibold text-foreground">
              Cập nhật trạng thái
            </p>
            <OrderStatusActions
              actions={actions}
              disabled={isUpdating}
              onSelect={onUpdateStatus}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
