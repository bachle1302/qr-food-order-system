"use client";

import Link from "next/link";
import {
  CalendarClock,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Table2,
  Utensils,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/shared/api/error";
import { getAccessToken } from "@/shared/auth/token-storage";
import { ErrorState } from "@/shared/ui/error-state";
import { LoadingState } from "@/shared/ui/loading-state";
import { getOrderDishes } from "../api/dishes.client";
import { getManagedOrders, updateOrderStatus } from "../api/orders.client";
import { getOrderTables } from "../api/tables.client";
import { useOrderEvents } from "../hooks/use-order-events";
import {
  ORDER_STATUSES,
  ORDER_TRANSITIONS,
  type Order,
  type OrderStatus,
} from "../types";
import {
  formatCurrency,
  formatDateTime,
  getDishLabel,
  getCustomerLabel,
  getOrderItemCount,
  getOrderTotal,
  getTableLabel,
  ORDER_STATUS_LABELS,
  STATUS_SUMMARY,
  type DishImageMap,
  type DishNameMap,
  type TableNameMap,
} from "../lib/order-ui";
import { OrderDetailPanel } from "./order-detail-panel";
import { MobileOrderCard } from "./mobile-order-card";
import { MobileOrderDetailSheet } from "./mobile-order-detail-sheet";
import { OrderStatusBadge } from "./order-status-badge";

type StatusFilter = (typeof ORDER_STATUSES)[number];

const UNSERVED_STATUSES = new Set<OrderStatus>([
  "NEW",
  "CONFIRMED",
  "PREPARING",
  "READY",
]);

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
  return "Không thể tải danh sách đơn hàng.";
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

function statusSelectOptions(status: OrderStatus) {
  return [status, ...ORDER_TRANSITIONS[status]];
}

function normalizeSearch(value: string) {
  return value.trim().toLocaleLowerCase("vi-VN");
}

export function StaffOrdersDashboard() {
  const [token, setToken] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dishImageById, setDishImageById] = useState<DishImageMap>({});
  const [dishNameById, setDishNameById] = useState<DishNameMap>({});
  const [tableNameById, setTableNameById] = useState<TableNameMap>({});
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [tableIdFilter, setTableIdFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [showUnservedOnly, setShowUnservedOnly] = useState(false);
  const [sortOldestFirst, setSortOldestFirst] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const loadOrders = useCallback(
    async (accessToken: string) => {
      setError(null);
      const response = await getManagedOrders(
        {
          fromDate: fromDate || undefined,
          tableId: tableIdFilter.trim() || undefined,
          toDate: toDate || undefined,
        },
        accessToken,
      );
      setOrders(response);
      setSelectedOrderId((current) => current ?? response[0]?.id ?? null);
    },
    [fromDate, tableIdFilter, toDate],
  );

  const loadDishes = useCallback(async (accessToken: string) => {
    const dishes = await getOrderDishes(accessToken);
    setDishNameById(
      Object.fromEntries(dishes.map((dish) => [dish.id, dish.name])),
    );
    setDishImageById(
      Object.fromEntries(
        dishes
          .filter((dish) => Boolean(dish.imageUrl))
          .map((dish) => [dish.id, dish.imageUrl as string]),
      ),
    );
  }, []);

  const loadTables = useCallback(async (accessToken: string) => {
    const tables = await getOrderTables(accessToken);
    setTableNameById(
      Object.fromEntries(tables.map((table) => [table.id, table.name])),
    );
  }, []);

  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      if (!active) {
        return;
      }

      const accessToken = getAccessToken();
      setToken(accessToken);
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    const accessToken = token;

    async function load() {
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
  }, [loadDishes, loadOrders, loadTables, token]);

  const handleRealtimeOrder = useCallback((event: { order: Order }) => {
    setOrders((current) => upsertOrder(current, event.order));
    setSelectedOrderId((current) => current ?? event.order.id);
  }, []);

  const { state: sseState } = useOrderEvents({
    token,
    onOrderCreated: handleRealtimeOrder,
    onOrderStatusChanged: handleRealtimeOrder,
  });

  const customerSearch = normalizeSearch(customerFilter);
  const visibleOrders = useMemo(() => {
    const filteredOrders = orders.filter((order) => {
      if (statusFilter !== "ALL" && order.status !== statusFilter) {
        return false;
      }

      if (showUnservedOnly && !UNSERVED_STATUSES.has(order.status)) {
        return false;
      }

      if (!customerSearch) {
        return true;
      }

      const searchable = [
        order.id,
        order.customerPhone ?? "",
        getCustomerLabel(order),
        order.tableId,
        getTableLabel(order.tableId, tableNameById),
        ...order.items.map((item) => item.dishName || getDishLabel(item.dishId, dishNameById)),
      ]
        .join(" ")
        .toLocaleLowerCase("vi-VN");

      return searchable.includes(customerSearch);
    });

    if (!sortOldestFirst) {
      return filteredOrders;
    }

    return [...filteredOrders].sort((firstOrder, secondOrder) => {
      const firstCreatedAt = new Date(firstOrder.createdAt).getTime();
      const secondCreatedAt = new Date(secondOrder.createdAt).getTime();

      if (Number.isNaN(firstCreatedAt) || Number.isNaN(secondCreatedAt)) {
        return firstOrder.id.localeCompare(secondOrder.id, "vi-VN");
      }

      return firstCreatedAt - secondCreatedAt;
    });
  }, [
    customerSearch,
    dishNameById,
    orders,
    showUnservedOnly,
    sortOldestFirst,
    statusFilter,
    tableNameById,
  ]);

  const selectedOrder = useMemo(
    () => visibleOrders.find((order) => order.id === selectedOrderId) ?? null,
    [selectedOrderId, visibleOrders],
  );

  const tableCards = useMemo(() => {
    const groups = new Map<
      string,
      { itemCount: number; orderCount: number; activeCount: number }
    >();

    for (const order of orders) {
      const current = groups.get(order.tableId) ?? {
        activeCount: 0,
        itemCount: 0,
        orderCount: 0,
      };
      current.orderCount += 1;
      current.itemCount += getOrderItemCount(order);
      if (!["PAID", "COMPLETED", "CANCELLED"].includes(order.status)) {
        current.activeCount += 1;
      }
      groups.set(order.tableId, current);
    }

    return Array.from(groups.entries())
      .map(([tableId, value]) => ({ tableId, ...value }))
      .sort((a, b) => a.tableId.localeCompare(b.tableId, "vi-VN"));
  }, [orders]);

  const summaryCounts = useMemo(
    () =>
      STATUS_SUMMARY.map((summary) => ({
        ...summary,
        count: orders.filter((order) => summary.statuses.includes(order.status))
          .length,
      })),
    [orders],
  );

  const statusTabCounts = useMemo(
    () =>
      Object.fromEntries(
        ORDER_STATUSES.map((status) => [
          status,
          status === "ALL"
            ? orders.length
            : orders.filter((order) => order.status === status).length,
        ]),
      ) as Record<StatusFilter, number>,
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
      setOrders((current) => upsertOrder(current, updated));
      setSelectedOrderId(updated.id);
    } catch (updateError) {
      setError(getErrorMessage(updateError));
    } finally {
      setUpdatingOrderId(null);
    }
  }

  function resetFilters() {
    setCustomerFilter("");
    setFromDate("");
    setShowUnservedOnly(false);
    setSortOldestFirst(false);
    setStatusFilter("ALL");
    setTableIdFilter("");
    setToDate("");
  }

  async function refresh() {
    if (!token) {
      return;
    }

    setIsLoading(true);
    try {
      await Promise.all([loadOrders(token), loadDishes(token), loadTables(token)]);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="grid min-h-[calc(100vh-2.5rem)] place-items-center">
        <div className="w-full max-w-md border-y border-gray-200 py-6 dark:border-slate-800 text-card-foreground">
          <h1 className="text-xl font-semibold text-foreground">
            Cần đăng nhập
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Vui lòng đăng nhập bằng tài khoản STAFF hoặc ADMIN để xem và xử lý
            đơn hàng.
          </p>
          <Button asChild className="mt-5">
            <Link href="/login">Đăng nhập</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_23rem]">
        <section className="min-w-0 border-y border-gray-200 text-foreground dark:border-slate-800">
          <div className="border-b border-border p-4 md:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">QR Food/RMS</p>
                <h1 className="mt-1 text-2xl font-semibold text-foreground">
                  Đơn hàng
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Quản lý đơn hàng
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground">
                  Kết nối realtime: {sseState}
                </span>
                <Button onClick={refresh} size="sm" variant="outline">
                  <RefreshCw className="size-4" />
                  Tải lại
                </Button>
              </div>
            </div>

            <div className="mt-5 space-y-4 lg:hidden">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
                  onChange={(event) => setCustomerFilter(event.target.value)}
                  placeholder="Tìm khách, bàn, mã đơn..."
                  value={customerFilter}
                />
              </label>

              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
                {ORDER_STATUSES.map((status) => {
                  const active = statusFilter === status;
                  return (
                    <button
                      className={`shrink-0 rounded-full border px-3 py-2 text-sm font-medium transition ${
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground"
                      }`}
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      type="button"
                    >
                      {status === "ALL" ? "Tất cả" : ORDER_STATUS_LABELS[status]}
                      <span className="ml-2 rounded-full bg-background/70 px-1.5 py-0.5 text-xs text-foreground">
                        {statusTabCounts[status]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 border-y border-border py-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-2 font-medium text-foreground">
                  <SlidersHorizontal className="size-4 text-primary" />
                  Tùy chọn
                </span>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-muted-foreground transition hover:border-primary hover:text-foreground">
                  <input
                    checked={showUnservedOnly}
                    className="size-4 accent-primary"
                    onChange={(event) => setShowUnservedOnly(event.target.checked)}
                    type="checkbox"
                  />
                  <span>Chỉ hiện món chưa phục vụ</span>
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-muted-foreground transition hover:border-primary hover:text-foreground">
                  <input
                    checked={sortOldestFirst}
                    className="size-4 accent-primary"
                    onChange={(event) => setSortOldestFirst(event.target.checked)}
                    type="checkbox"
                  />
                  <span>Order trước lên đầu</span>
                </label>
              </div>
            </div>

            <div className="mt-6 hidden gap-3 md:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <label className="space-y-1">
                <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <CalendarClock className="size-4 text-muted-foreground" />
                  Từ ngày
                </span>
                <input
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
                  onChange={(event) => setFromDate(event.target.value)}
                  type="date"
                  value={fromDate}
                />
              </label>
              <label className="space-y-1">
                <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <CalendarClock className="size-4 text-muted-foreground" />
                  Đến ngày
                </span>
                <input
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
                  onChange={(event) => setToDate(event.target.value)}
                  type="date"
                  value={toDate}
                />
              </label>
              <div className="flex items-end">
                <Button
                  className="h-10 w-full lg:w-auto"
                  onClick={resetFilters}
                  variant="outline"
                >
                  Reset
                </Button>
              </div>
            </div>

            <div className="mt-4 hidden gap-3 md:grid md:grid-cols-3">
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
                  onChange={(event) => setCustomerFilter(event.target.value)}
                  placeholder="Tên khách, bàn, mã đơn..."
                  value={customerFilter}
                />
              </label>
              <label className="relative">
                <Table2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
                  onChange={(event) => setTableIdFilter(event.target.value)}
                  placeholder="Số bàn hoặc mã bàn"
                  value={tableIdFilter}
                />
              </label>
              <select
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
                value={statusFilter}
              >
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status === "ALL" ? "Tất cả trạng thái" : ORDER_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-5 p-4 md:p-6">
            {error ? <ErrorState message={error} /> : null}

            <div className="hidden gap-3 overflow-x-auto pb-1 lg:flex">
              {tableCards.length === 0 ? (
                <div className="min-w-40 border-y border-dashed border-gray-200 py-4 dark:border-slate-800 text-sm text-muted-foreground">
                  Chưa có bàn từ dữ liệu đơn hàng.
                </div>
              ) : (
                tableCards.map((table) => {
                  const active = tableIdFilter.trim() === table.tableId;
                  return (
                    <button
                      className={`min-w-28 border-y px-3 py-4 text-left transition hover:border-primary hover:text-primary ${
                        active
                          ? "border-primary bg-primary/15"
                          : "border-gray-200 bg-transparent dark:border-slate-800"
                      }`}
                      key={table.tableId}
                      onClick={() => setTableIdFilter(table.tableId)}
                      type="button"
                    >
                      <p className="text-lg font-semibold text-foreground">
                        {getTableLabel(table.tableId, tableNameById)}
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <span>Đơn</span>
                        <span className="text-right text-foreground">
                          {table.orderCount}
                        </span>
                        <span>Món</span>
                        <span className="text-right text-foreground">
                          {table.itemCount}
                        </span>
                        <span>Đang xử lý</span>
                        <span className="text-right text-foreground">
                          {table.activeCount}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="hidden flex-wrap gap-2 lg:flex">
              {summaryCounts.map((summary) => (
                <span
                  className="rounded-md border border-border bg-muted px-3 py-1 text-xs font-medium text-foreground"
                  key={summary.label}
                >
                  {summary.label}: {summary.count}
                </span>
              ))}
            </div>

            {isLoading ? <LoadingState label="Đang tải đơn hàng..." /> : null}

            {!isLoading && visibleOrders.length === 0 ? (
              <div className="border-y border-dashed border-gray-200 py-8 text-center dark:border-slate-800">
                <Utensils className="mx-auto size-8 text-muted-foreground" />
                <h2 className="mt-3 font-semibold text-foreground">
                  Chưa có đơn hàng
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Không có đơn hàng nào phù hợp bộ lọc hiện tại.
                </p>
              </div>
            ) : null}

            {visibleOrders.length > 0 ? (
              <div className="overflow-hidden border-y border-border lg:hidden">
                {visibleOrders.map((order) => (
                  <MobileOrderCard
                    dishNameById={dishNameById}
                    isActive={selectedOrderId === order.id}
                    key={order.id}
                    onSelect={() => {
                      setSelectedOrderId(order.id);
                      setIsMobileDetailOpen(true);
                    }}
                    order={order}
                    tableNameById={tableNameById}
                  />
                ))}
              </div>
            ) : null}

            {visibleOrders.length > 0 ? (
              <div className="hidden overflow-hidden rounded-lg border border-gray-200 dark:border-slate-800 lg:block">
                <div className="hidden grid-cols-[5rem_minmax(9rem,1fr)_minmax(16rem,1.8fr)_12rem_9rem_11rem] border-b border-gray-200 px-4 py-3 text-sm font-medium text-muted-foreground dark:border-slate-800 lg:grid">
                  <span>Bàn</span>
                  <span>Khách hàng</span>
                  <span>Món ăn</span>
                  <span>Trạng thái</span>
                  <span>Người xử lý</span>
                  <span>Thời gian</span>
                </div>
                <div className="divide-y divide-border">
                  {visibleOrders.map((order) => {
                    const actions = ORDER_TRANSITIONS[order.status];
                    const active = selectedOrderId === order.id;
                    return (
                      <div
                        className={`grid w-full gap-3 px-4 py-3 text-left transition hover:bg-muted/70 lg:grid-cols-[5rem_minmax(9rem,1fr)_minmax(16rem,1.8fr)_12rem_9rem_11rem] lg:items-center ${
                          active
                            ? "ring-2 ring-primary bg-primary/15 rounded-lg relative z-10"
                            : "bg-transparent"
                        }`}
                        key={order.id}
                        onClick={() => setSelectedOrderId(order.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedOrderId(order.id);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground lg:hidden">
                            Bàn
                          </p>
                          <p className="text-sm text-foreground">
                            {getTableLabel(order.tableId, tableNameById)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground lg:hidden">
                            Khách hàng
                          </p>
                          <p className="text-sm text-foreground">
                            {getCustomerLabel(order)}
                          </p>
                          {order.customerPhone ? (
                            <p className="text-xs text-muted-foreground">
                              {order.customerPhone}
                            </p>
                          ) : null}
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-foreground lg:hidden">
                            Món ăn
                          </p>
                          {order.items.slice(0, 2).map((item, index) => (
                            <div
                              className="flex items-center justify-between gap-3 border-b border-gray-200 py-2 dark:border-slate-800"
                              key={`${order.id}-${item.dishId}-${index}`}
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-foreground">
                                  {getDishLabel(item.dishId, dishNameById)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatCurrency(item.pricePerUnit)}
                                </p>
                              </div>
                              <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground">
                                x{item.quantity}
                              </span>
                            </div>
                          ))}
                          {order.items.length > 2 ? (
                            <p className="text-xs text-muted-foreground">
                              +{order.items.length - 2} món khác
                            </p>
                          ) : null}
                        </div>
                        <div onClick={(event) => event.stopPropagation()}>
                          <p className="mb-2 text-sm font-medium text-foreground lg:hidden">
                            Trạng thái
                          </p>
                          <select
                            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
                            disabled={updatingOrderId === order.id}
                            onChange={(event) => {
                              const nextStatus = event.target.value as OrderStatus;
                              if (nextStatus !== order.status) {
                                handleUpdateStatus(order.id, nextStatus);
                              }
                            }}
                            value={order.status}
                          >
                            {statusSelectOptions(order.status).map((status) => (
                              <option key={status} value={status}>
                                {ORDER_STATUS_LABELS[status]}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground lg:hidden">
                            Người xử lý
                          </p>
                          <p className="text-sm text-muted-foreground">-</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground lg:hidden">
                            Thời gian
                          </p>
                          <p className="text-sm text-foreground">
                            {formatDateTime(order.createdAt)}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatCurrency(getOrderTotal(order))}
                          </p>
                        </div>
                        <div className="lg:hidden">
                          <OrderStatusBadge status={order.status} />
                        </div>
                        {actions.length === 0 ? null : (
                          <span className="sr-only">
                            Có {actions.length} thao tác trạng thái tiếp theo
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <div className="hidden xl:block">
          <OrderDetailPanel
            actions={selectedOrder ? ORDER_TRANSITIONS[selectedOrder.status] : []}
            dishImageById={dishImageById}
            dishNameById={dishNameById}
            tableNameById={tableNameById}
            isUpdating={selectedOrder ? updatingOrderId === selectedOrder.id : false}
            onUpdateStatus={(status) => {
              if (selectedOrder) {
                handleUpdateStatus(selectedOrder.id, status);
              }
            }}
            order={selectedOrder}
          />
        </div>

        <MobileOrderDetailSheet
          actions={selectedOrder ? ORDER_TRANSITIONS[selectedOrder.status] : []}
          dishImageById={dishImageById}
          dishNameById={dishNameById}
          isOpen={isMobileDetailOpen}
          isUpdating={selectedOrder ? updatingOrderId === selectedOrder.id : false}
          onClose={() => setIsMobileDetailOpen(false)}
          onUpdateStatus={(status) => {
            if (selectedOrder) {
              handleUpdateStatus(selectedOrder.id, status);
            }
          }}
          order={selectedOrder}
          tableNameById={tableNameById}
        />
    </div>
  );
}
