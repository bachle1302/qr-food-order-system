"use client";

import { Loader2, ReceiptText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Dish } from "@/features/menu/types";
import type { OrderResponse, OrderItemResponse } from "../types";

type CustomerOrdersSectionProps = {
  dishes: Dish[];
  error: string | null;
  isLoading: boolean;
  onRefresh: () => void;
  orders: OrderResponse[];
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  NEW: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  PREPARING: "Đang chuẩn bị",
  READY: "Sẵn sàng phục vụ",
  SERVED: "Đã phục vụ",
  PAID: "Đã thanh toán",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
};

function formatCurrency(value?: number | null) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getOrderStatusLabel(status: string) {
  return ORDER_STATUS_LABELS[status] ?? status;
}

function getDishName(dishes: Dish[], dishId: string) {
  return dishes.find((dish) => dish.id === dishId)?.name ?? `Món #${dishId}`;
}

function getDishImageUrl(dishes: Dish[], item: OrderItemResponse) {
  if (item.dishImageUrl) {
    return item.dishImageUrl;
  }
  return dishes.find((dish) => dish.id === item.dishId)?.imageUrl ?? "";
}

function getShortOrderId(orderId: string) {
  return orderId.length > 8 ? orderId.slice(-8).toUpperCase() : orderId;
}

export function CustomerOrdersSection({
  dishes,
  error,
  isLoading,
  onRefresh,
  orders,
}: CustomerOrdersSectionProps) {
  return (
    <section className="py-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-orange-500/10 p-2 text-orange-600 dark:text-orange-300">
            <ReceiptText className="size-5" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Đơn của bạn</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Theo dõi trạng thái món đang đặt
            </p>
          </div>
        </div>
        <Button
          disabled={isLoading}
          onClick={onRefresh}
          size="sm"
          type="button"
          variant="outline"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <RefreshCw />
          )}
          Làm mới
        </Button>
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      {isLoading && orders.length === 0 ? (
        <div className="mt-4 flex items-center gap-2 border-y border-gray-200 py-4 text-sm text-muted-foreground dark:border-slate-800">
          <Loader2 className="size-4 animate-spin" />
          Đang tải đơn của bạn...
        </div>
      ) : null}

      {!isLoading && orders.length === 0 ? (
        <div className="mt-4 border-y border-dashed border-orange-200/70 py-5 text-center dark:border-orange-500/25">
          <ReceiptText className="mx-auto size-7 text-muted-foreground" />
          <p className="mt-3 font-medium text-foreground">
            Bạn chưa có đơn nào
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Hãy chọn món và gửi đơn cho nhân viên.
          </p>
        </div>
      ) : null}

      {orders.length > 0 ? (
        <div className="mt-4 space-y-3">
          {orders.map((order) => (
            <article
              className="border-b border-gray-200 py-4 dark:border-slate-800"
              key={order.id}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(order.createdAt)}
                  </p>
                  <h3 className="mt-1 text-sm font-semibold text-foreground">
                    Đơn #{getShortOrderId(order.id)}
                  </h3>
                </div>
                <span className="w-fit rounded-full border border-orange-200/70 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700 dark:border-orange-500/25 dark:bg-orange-500/10 dark:text-orange-300">
                  {getOrderStatusLabel(order.status)}
                </span>
              </div>

              <div className="mt-3 space-y-3">
                {order.items.map((item, index) => {
                  const imageUrl = getDishImageUrl(dishes, item);
                  return (
                    <div
                      className="flex items-center gap-3 text-sm py-1.5"
                      key={`${order.id}-${item.dishId}-${index}`}
                    >
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-orange-500/10 border border-orange-500/10 dark:border-orange-500/20">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={item.dishName || getDishName(dishes, item.dishId)}
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center text-orange-600 dark:text-orange-300">
                            <span className="text-[10px] font-bold">Food</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground">
                          {item.dishName || getDishName(dishes, item.dishId)}
                        </p>
                        {item.note ? (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Ghi chú: {item.note}
                          </p>
                        ) : null}
                      </div>

                      <div className="text-right shrink-0 ml-2">
                        <p className="font-medium text-foreground">
                          x{item.quantity}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(item.pricePerUnit)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {order.note ? (
                <div className="mt-3 border-l-2 border-orange-500/50 pl-3 text-sm">
                  <p className="text-muted-foreground">Ghi chú đơn</p>
                  <p className="mt-1 text-foreground">{order.note}</p>
                </div>
              ) : null}

              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <span className="text-sm text-muted-foreground">
                  Tổng tiền
                </span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(order.finalPrice ?? order.totalPrice)}
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
