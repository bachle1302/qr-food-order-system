"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/shared/api/error";
import { getAccessToken } from "@/shared/auth/token-storage";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { LoadingState } from "@/shared/ui/loading-state";
import {
  getManagedOrders,
  updateOrderStatus,
} from "../api/orders.client";
import { useOrderEvents } from "../hooks/use-order-events";
import {
  ORDER_STATUSES,
  ORDER_TRANSITIONS,
  type Order,
  type OrderStatus,
} from "../types";
import { OrderCard } from "./order-card";

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      return "Phien dang nhap het han hoac khong co quyen truy cap.";
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Khong the tai danh sach order.";
}

function upsertOrder(orders: Order[], nextOrder: Order) {
  const exists = orders.some((order) => order.id === nextOrder.id);
  if (!exists) {
    return [nextOrder, ...orders];
  }

  return orders.map((order) =>
    order.id === nextOrder.id ? nextOrder : order,
  );
}

export function StaffOrdersDashboard() {
  const [token, setToken] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] =
    useState<(typeof ORDER_STATUSES)[number]>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const loadOrders = useCallback(
    async (accessToken: string, status: typeof statusFilter) => {
      setError(null);
      const response = await getManagedOrders({ status }, accessToken);
      setOrders(response);
    },
    [],
  );

  useEffect(() => {
    async function readToken() {
      const accessToken = getAccessToken();
      setToken(accessToken);
      setIsLoading(false);
    }

    readToken();
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    const accessToken = token;

    async function load() {
      setIsLoading(true);
      try {
        await loadOrders(accessToken, statusFilter);
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [loadOrders, statusFilter, token]);

  const handleRealtimeOrder = useCallback(
    (event: { order: Order }) => {
      setOrders((current) => upsertOrder(current, event.order));
    },
    [],
  );

  const { state: sseState } = useOrderEvents({
    token,
    onOrderCreated: handleRealtimeOrder,
    onOrderStatusChanged: handleRealtimeOrder,
  });

  const visibleOrders = useMemo(() => {
    if (statusFilter === "ALL") {
      return orders;
    }
    return orders.filter((order) => order.status === statusFilter);
  }, [orders, statusFilter]);

  async function handleUpdateStatus(orderId: string, status: OrderStatus) {
    if (!token) {
      setError("Vui long dang nhap de cap nhat order.");
      return;
    }

    setUpdatingOrderId(orderId);
    setError(null);

    try {
      const updated = await updateOrderStatus(orderId, status, token);
      setOrders((current) => upsertOrder(current, updated));
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
          title="Can dang nhap"
          description="Vui long dang nhap bang tai khoan STAFF hoac ADMIN de xem order."
        />
        <Button asChild>
          <Link href="/login">Dang nhap</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Realtime</p>
          <p className="font-medium text-foreground">SSE: {sseState}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/staff/kitchen">Open kitchen</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {ORDER_STATUSES.map((status) => (
          <Button
            key={status}
            onClick={() => setStatusFilter(status)}
            variant={statusFilter === status ? "default" : "outline"}
          >
            {status}
          </Button>
        ))}
      </div>

      {error ? <ErrorState message={error} /> : null}
      {isLoading ? <LoadingState label="Dang tai order..." /> : null}

      {!isLoading && visibleOrders.length === 0 ? (
        <EmptyState
          title="Chua co order"
          description="Khong co order nao phu hop bo loc hien tai."
        />
      ) : null}

      <div className="grid gap-4">
        {visibleOrders.map((order) => (
          <OrderCard
            actions={ORDER_TRANSITIONS[order.status]}
            isUpdating={updatingOrderId === order.id}
            key={order.id}
            onUpdateStatus={handleUpdateStatus}
            order={order}
          />
        ))}
      </div>
    </div>
  );
}
