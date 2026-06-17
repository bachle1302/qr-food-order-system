"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { getOrderDishes } from "@/features/orders/api/dishes.client";
import { getKitchenOrders, updateOrderStatus } from "@/features/orders/api/orders.client";
import { getOrderTables } from "@/features/orders/api/tables.client";
import { OrderCard } from "@/features/orders/components/order-card";
import { useOrderEvents } from "@/features/orders/hooks/use-order-events";
import type { Order, OrderStatus } from "@/features/orders/types";
import {
  ORDER_STATUS_LABELS,
  type DishNameMap,
  type TableNameMap,
} from "@/features/orders/lib/order-ui";
import { ApiError } from "@/shared/api/error";
import { getAccessToken } from "@/shared/auth/token-storage";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { LoadingState } from "@/shared/ui/loading-state";

const KITCHEN_STATUSES: OrderStatus[] = ["CONFIRMED", "PREPARING", "READY"];

const KITCHEN_ACTIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  CONFIRMED: ["PREPARING"],
  PREPARING: ["READY"],
  READY: ["SERVED"],
};

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      return "Phiên đăng nhập hết hạn hoặc không có quyền truy cập.";
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Không thể tải danh sách bếp.";
}

function upsertKitchenOrder(orders: Order[], order: Order) {
  if (!KITCHEN_STATUSES.includes(order.status)) {
    return orders.filter((item) => item.id !== order.id);
  }

  if (!orders.some((item) => item.id === order.id)) {
    return [order, ...orders];
  }

  return orders.map((item) => (item.id === order.id ? order : item));
}

export function KitchenDashboard() {
  const [token, setToken] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dishNameById, setDishNameById] = useState<DishNameMap>({});
  const [tableNameById, setTableNameById] = useState<TableNameMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const loadOrders = useCallback(async (accessToken: string) => {
    setError(null);
    const response = await getKitchenOrders(accessToken);
    setOrders(response);
  }, []);

  const loadDishes = useCallback(async (accessToken: string) => {
    const dishes = await getOrderDishes(accessToken);
    setDishNameById(
      Object.fromEntries(dishes.map((dish) => [dish.id, dish.name])),
    );
  }, []);

  const loadTables = useCallback(async (accessToken: string) => {
    const tables = await getOrderTables(accessToken);
    setTableNameById(
      Object.fromEntries(tables.map((table) => [table.id, table.name])),
    );
  }, []);

  useEffect(() => {
    async function load() {
      const accessToken = getAccessToken();
      setToken(accessToken);

      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        await Promise.all([
          loadOrders(accessToken),
          loadDishes(accessToken),
          loadTables(accessToken),
        ]);
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [loadDishes, loadOrders, loadTables]);

  const handleRealtimeOrder = useCallback((event: { order: Order }) => {
    setOrders((current) => upsertKitchenOrder(current, event.order));
  }, []);

  const { state: sseState } = useOrderEvents({
    token,
    onOrderCreated: handleRealtimeOrder,
    onOrderStatusChanged: handleRealtimeOrder,
  });

  const groupedOrders = useMemo(
    () =>
      KITCHEN_STATUSES.map((status) => ({
        status,
        orders: orders.filter((order) => order.status === status),
      })),
    [orders],
  );

  async function handleUpdateStatus(orderId: string, status: OrderStatus) {
    if (!token) {
      setError("Vui lòng đăng nhập để cập nhật đơn hàng.");
      return;
    }

    setUpdatingOrderId(orderId);
    setError(null);

    try {
      const updated = await updateOrderStatus(orderId, status, token);
      setOrders((current) => upsertKitchenOrder(current, updated));
    } catch (updateError) {
      setError(getErrorMessage(updateError));
    } finally {
      setUpdatingOrderId(null);
    }
  }

  if (!token) {
    return (
      <div className="space-y-4">
        <EmptyState
          title="Cần đăng nhập"
          description="Vui lòng đăng nhập bằng tài khoản STAFF hoặc ADMIN để xem màn bếp."
        />
        <Button asChild>
          <Link href="/login">Đăng nhập</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Realtime</p>
          <p className="font-medium text-foreground">
            Kết nối realtime: {sseState}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/staff/orders">Mở quản lý đơn</Link>
        </Button>
      </div>

      {error ? <ErrorState message={error} /> : null}
      {isLoading ? <LoadingState label="Dang tai kitchen queue..." /> : null}

      <div className="grid gap-4 xl:grid-cols-3">
        {groupedOrders.map((group) => (
          <section
            className="rounded-lg border border-border bg-card p-4"
            key={group.status}
          >
            <h2 className="font-semibold text-foreground">
              {ORDER_STATUS_LABELS[group.status]}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {group.orders.length} đơn
            </p>
            <div className="mt-4 space-y-4">
              {group.orders.length === 0 ? (
                <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Không có đơn.
                </div>
              ) : (
                group.orders.map((order) => (
                  <OrderCard
                    actions={KITCHEN_ACTIONS[order.status] ?? []}
                    dishNameById={dishNameById}
                    tableNameById={tableNameById}
                    isUpdating={updatingOrderId === order.id}
                    key={order.id}
                    onUpdateStatus={handleUpdateStatus}
                    order={order}
                  />
                ))
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
