"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeDollarSign,
  CalendarDays,
  ChefHat,
  ClipboardList,
  LayoutDashboard,
  Tags,
  TicketPercent,
  Users,
  Utensils,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrderStatus } from "@/features/orders/types";
import { ApiError } from "@/shared/api/error";
import { getAccessToken } from "@/shared/auth/token-storage";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { LoadingState } from "@/shared/ui/loading-state";
import {
  getDailyRevenue,
  getDailySummary,
  getManagedOrders,
  getMonthlyRevenue,
} from "../api/dashboard.client";
import type { DailySummary, DashboardOrder } from "../types";

const OPERATING_STATUSES: OrderStatus[] = [
  "NEW",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "SERVED",
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: "Mới",
  CONFIRMED: "Đã xác nhận",
  PREPARING: "Đang chế biến",
  READY: "Sẵn sàng",
  SERVED: "Đã phục vụ",
  PAID: "Đã thanh toán",
  CANCELLED: "Đã hủy",
  COMPLETED: "Hoàn tất",
};

const QUICK_LINKS = [
  {
    href: "/admin/tables",
    label: "Quản lý bàn",
    description: "Bàn ăn và QR token",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/categories",
    label: "Quản lý danh mục",
    description: "Nhóm món trong menu",
    icon: Tags,
  },
  {
    href: "/admin/dishes",
    label: "Quản lý món ăn",
    description: "Giá, ảnh và trạng thái món",
    icon: Utensils,
  },
  {
    href: "/admin/users",
    label: "Quản lý nhân viên",
    description: "Tài khoản ADMIN/STAFF",
    icon: Users,
  },
  {
    href: "/admin/discounts",
    label: "Quản lý mã giảm giá",
    description: "Mã, hạn dùng và giới hạn",
    icon: TicketPercent,
  },
  {
    href: "/staff/orders",
    label: "Quản lý đơn hàng",
    description: "Xử lý đơn theo trạng thái",
    icon: ClipboardList,
  },
  {
    href: "/staff/kitchen",
    label: "Màn bếp",
    description: "Hàng đợi bếp",
    icon: ChefHat,
  },
];

function getTodayInputValue() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function getMonthInputValue(date: string) {
  return date.slice(0, 7);
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      return "Phiên đăng nhập hết hạn hoặc không có quyền truy cập dashboard.";
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Không thể tải dữ liệu dashboard.";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <article className="rounded-lg border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </article>
  );
}

function countByStatus(orders: DashboardOrder[]) {
  return orders.reduce<Record<OrderStatus, number>>(
    (counts, order) => {
      counts[order.status] = (counts[order.status] ?? 0) + 1;
      return counts;
    },
    {
      NEW: 0,
      CONFIRMED: 0,
      PREPARING: 0,
      READY: 0,
      SERVED: 0,
      PAID: 0,
      CANCELLED: 0,
      COMPLETED: 0,
    },
  );
}

export function AdminDashboardPage() {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState(getTodayInputValue);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [dailyRevenue, setDailyRevenue] = useState<number | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<number | null>(null);
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statusCounts = useMemo(() => countByStatus(orders), [orders]);
  const processingOrders = OPERATING_STATUSES.reduce(
    (total, status) => total + statusCounts[status],
    0,
  );
  const hasNoOrdersForDate = summary ? summary.totalOrders === 0 : false;

  const loadDashboard = useCallback(async (accessToken: string, date: string) => {
    setIsLoading(true);
    setError(null);

    if (!date) {
      setError("Vui lòng chọn ngày thống kê hợp lệ.");
      setIsLoading(false);
      return;
    }

    try {
      const month = getMonthInputValue(date);
      const [
        nextSummary,
        nextDailyRevenue,
        nextMonthlyRevenue,
        nextOrders,
      ] = await Promise.all([
        getDailySummary(date, accessToken),
        getDailyRevenue(date, accessToken),
        getMonthlyRevenue(month, accessToken),
        getManagedOrders({}, accessToken),
      ]);

      setSummary(nextSummary);
      setDailyRevenue(nextDailyRevenue);
      setMonthlyRevenue(nextMonthlyRevenue);
      setOrders(nextOrders);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    Promise.resolve().then(() => {
      if (!isMounted) {
        return;
      }

      const accessToken = getAccessToken();
      setToken(accessToken);

      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      void loadDashboard(accessToken, selectedDate);
    });

    return () => {
      isMounted = false;
    };
  }, [loadDashboard, selectedDate]);

  if (token === undefined) {
    return <LoadingState label="Đang kiểm tra phiên đăng nhập..." />;
  }

  if (!token) {
    return (
      <div className="space-y-4">
        <EmptyState
          title="Cần đăng nhập"
          description="Vui lòng đăng nhập bằng tài khoản ADMIN để xem dashboard doanh thu."
        />
        <Button asChild>
          <Link href="/login">Đăng nhập</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Tổng quan quản trị
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Số liệu lấy từ API đơn hàng và doanh thu thật.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="grid gap-1 text-sm text-foreground">
              Ngày thống kê
              <input
                className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onChange={(event) => setSelectedDate(event.target.value)}
                type="date"
                value={selectedDate}
              />
            </label>
            <Button
              onClick={() => {
                if (token) {
                  void loadDashboard(token, selectedDate);
                }
              }}
              type="button"
              variant="outline"
            >
              <CalendarDays />
              Tải lại
            </Button>
          </div>
        </div>
      </section>

      {error ? <ErrorState message={error} /> : null}
      {isLoading ? <LoadingState label="Đang tải dashboard..." /> : null}

      {!isLoading && !error && summary ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              description={`Từ tổng hợp ngày ${summary.date}`}
              label="Tổng đơn hôm nay"
              value={formatNumber(summary.totalOrders)}
            />
            <StatCard
              description="Từ API doanh thu theo ngày"
              label="Doanh thu hôm nay"
              value={formatCurrency(dailyRevenue ?? summary.totalRevenue)}
            />
            <StatCard
              description="Tính từ danh sách đơn quản lý"
              label="Đơn đang xử lý"
              value={formatNumber(processingOrders)}
            />
            <StatCard
              description="Từ tổng hợp đơn theo ngày"
              label="Hoàn tất / hủy"
              value={`${formatNumber(summary.completedOrders)} / ${formatNumber(
                summary.cancelledOrders,
              )}`}
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <article className="rounded-lg border border-border bg-card p-4 lg:col-span-2">
              <div className="flex items-start gap-3">
                <div className="rounded-md border border-border bg-muted p-2">
                  <BadgeDollarSign className="size-5 text-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Doanh thu tháng
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Lấy từ API doanh thu theo tháng{" "}
                    {getMonthInputValue(selectedDate)}.
                  </p>
                </div>
              </div>
              <p className="mt-4 text-3xl font-semibold text-foreground">
                {formatCurrency(monthlyRevenue ?? 0)}
              </p>
            </article>

            <article className="rounded-lg border border-border bg-card p-4">
              <h3 className="font-semibold text-foreground">
                Tổng hợp ngày
              </h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Đang chờ/xử lý</dt>
                  <dd className="font-medium text-foreground">
                    {formatNumber(summary.pendingOrders)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Giá trị trung bình</dt>
                  <dd className="font-medium text-foreground">
                    {formatCurrency(summary.averageOrderValue)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Số mã đơn</dt>
                  <dd className="font-medium text-foreground">
                    {formatNumber(summary.orderIds.length)}
                  </dd>
                </div>
              </dl>
            </article>
          </section>

          {hasNoOrdersForDate ? (
            <EmptyState
              title="Chưa có đơn trong ngày này"
              description="Đổi ngày thống kê hoặc kiểm tra lại khi có đơn mới."
            />
          ) : null}
        </>
      ) : null}

      {!isLoading && !error ? (
        <section className="rounded-lg border border-border bg-card p-4">
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold text-foreground">
              Đơn hàng theo trạng thái
            </h3>
            <p className="text-sm text-muted-foreground">
              Các số liệu này được tính từ dữ liệu đơn hàng thật.
            </p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((status) => (
              <div
                className="rounded-md border border-border bg-background p-3"
                key={status}
              >
                <p className="text-xs text-muted-foreground">
                  {STATUS_LABELS[status]}
                </p>
                <p className="mt-1 text-xl font-semibold text-foreground">
                  {formatNumber(statusCounts[status])}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-lg border border-border bg-card p-4">
        <h3 className="font-semibold text-foreground">Lối tắt vận hành</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {QUICK_LINKS.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                className="rounded-lg border border-border bg-background p-4 transition-colors hover:bg-muted"
                href={item.href}
                key={item.href}
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-md border border-border bg-muted p-2">
                    <Icon className="size-5 text-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
