"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Clock,
  ChefHat,
  CheckCircle2,
  TrendingUp,
  Users,
  UtensilsCrossed,
  ReceiptText,
  MoreVertical,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrderStatus } from "@/features/orders/types";
import { ApiError } from "@/shared/api/error";
import { getAccessToken } from "@/shared/auth/token-storage";
import { useDelayedLoadingMessage } from "@/shared/hooks/use-delayed-loading-message";
import { ColdStartNotice } from "@/shared/ui/cold-start-notice";
import { ErrorState } from "@/shared/ui/error-state";
import { LoadingState } from "@/shared/ui/loading-state";
import { getOrderDishes } from "@/features/orders/api/dishes.client";
import { getOrderTables } from "@/features/orders/api/tables.client";
import {
  getDailyRevenue,
  getDailySummary,
  getManagedOrders,
} from "../api/dashboard.client";
import type { DailySummary, DashboardOrder } from "../types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// --- TIỆN ÍCH ---
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("vi-VN").format(value);
};

function getTodayInputValue() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
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

// --- COMPONENTS ---
type StatCardProps = {
  title: string;
  value: string;
  trend: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  colorClass: string;
};

const StatCard = ({ title, value, trend, icon: Icon, colorClass }: StatCardProps) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center justify-between transition-transform hover:-translate-y-1 hover:shadow-md">
    <div>
      <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800 dark:text-slate-100">{value}</h3>
      <p className={`text-xs mt-2 flex items-center gap-1 ${trend >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
        <TrendingUp size={14} className={trend < 0 ? "rotate-180" : ""} />
        <span>{Math.abs(trend)}% so với hôm qua</span>
      </p>
    </div>
    <div className={`p-4 rounded-xl shadow-lg ${colorClass}`}>
      <Icon size={24} className="text-white" />
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: OrderStatus }) => {
  switch (status) {
    case "NEW":
    case "CONFIRMED":
      return (
        <span className="flex items-center w-fit gap-1.5 bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 px-3 py-1.5 rounded-full text-xs font-semibold">
          <Clock size={14} /> Chờ bếp nhận
        </span>
      );
    case "PREPARING":
    case "READY":
      return (
        <span className="flex items-center w-fit gap-1.5 bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 px-3 py-1.5 rounded-full text-xs font-semibold">
          <ChefHat size={14} /> Đang nấu
        </span>
      );
    case "SERVED":
    case "PAID":
    case "COMPLETED":
      return (
        <span className="flex items-center w-fit gap-1.5 bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300 px-3 py-1.5 rounded-full text-xs font-semibold">
          <CheckCircle2 size={14} /> Đã lên món
        </span>
      );
    case "CANCELLED":
      return (
        <span className="flex items-center w-fit gap-1.5 bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300 px-3 py-1.5 rounded-full text-xs font-semibold">
          <Clock size={14} /> Đã hủy
        </span>
      );
    default:
      return null;
  }
};

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className}`} />;
}

function AdminDashboardSkeleton({
  showColdStartMessage,
}: {
  showColdStartMessage: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["revenue", "orders", "average", "tables"].map((item) => (
          <div
            className="rounded-2xl border border-border bg-card p-6"
            key={item}
          >
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="mt-4 h-8 w-36" />
            <SkeletonBlock className="mt-4 h-3 w-24" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <SkeletonBlock className="h-5 w-40" />
          <SkeletonBlock className="mt-6 h-72 w-full" />
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <SkeletonBlock className="h-5 w-44" />
          <div className="mt-6 space-y-5">
            {["one", "two", "three", "four"].map((item) => (
              <div className="flex items-center gap-4" key={item}>
                <SkeletonBlock className="size-8 rounded-full" />
                <div className="flex-1">
                  <SkeletonBlock className="h-4 w-32" />
                  <SkeletonBlock className="mt-2 h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <SkeletonBlock className="h-5 w-40" />
        <div className="mt-6 space-y-3">
          {["a", "b", "c", "d"].map((item) => (
            <SkeletonBlock className="h-14 w-full" key={item} />
          ))}
        </div>
      </div>

      {showColdStartMessage ? <ColdStartNotice /> : null}
    </div>
  );
}

export function AdminDashboardPage() {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState(getTodayInputValue);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [dailyRevenue, setDailyRevenue] = useState<number | null>(null);
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [dishNameById, setDishNameById] = useState<Record<string, string>>({});
  const [tableNameById, setTableNameById] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const showColdStartMessage = useDelayedLoadingMessage(
    isLoading && Boolean(token),
  );

  const loadDashboard = useCallback(async (accessToken: string, date: string) => {
    setIsLoading(true);
    setError(null);

    if (!date) {
      setError("Vui lòng chọn ngày thống kê hợp lệ.");
      setIsLoading(false);
      return;
    }

    try {
      const [
        nextSummary,
        nextDailyRevenue,
        nextOrders,
        nextDishes,
        nextTables,
      ] = await Promise.all([
        getDailySummary(date, accessToken),
        getDailyRevenue(date, accessToken),
        getManagedOrders({}, accessToken),
        getOrderDishes(accessToken),
        getOrderTables(accessToken),
      ]);

      setSummary(nextSummary);
      setDailyRevenue(nextDailyRevenue);
      setOrders(nextOrders);
      setDishNameById(
        Object.fromEntries(nextDishes.map((dish) => [dish.id, dish.name]))
      );
      setTableNameById(
        Object.fromEntries(nextTables.map((table) => [table.id, table.name]))
      );
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

  const retryDashboard = useCallback(() => {
    if (token) {
      void loadDashboard(token, selectedDate);
    }
  }, [loadDashboard, selectedDate, token]);

  const activeTableIds = useMemo(() => {
    return new Set(
      orders
        .filter((o) => !["PAID", "CANCELLED", "COMPLETED"].includes(o.status))
        .map((o) => o.tableId)
    );
  }, [orders]);

  const totalTablesCount = useMemo(() => {
    return Object.keys(tableNameById).length;
  }, [tableNameById]);

  const tablesServingText = useMemo(() => {
    return `${activeTableIds.size}/${totalTablesCount}`;
  }, [activeTableIds, totalTablesCount]);

  const computedRevenueData = useMemo(() => {
    const weekdays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const data = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);

      const startOfDay = new Date(d);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(d);
      endOfDay.setHours(23, 59, 59, 999);

      const revenue = orders
        .filter((order) => {
          if (!["PAID", "COMPLETED"].includes(order.status)) return false;
          const orderDate = new Date(order.createdAt);
          return orderDate >= startOfDay && orderDate <= endOfDay;
        })
        .reduce((sum, order) => sum + (order.finalPrice || order.totalPrice || 0), 0);

      const dayName = weekdays[d.getDay()];
      data.push({ name: dayName, revenue });
    }

    return data;
  }, [orders]);

  const computedTopItems = useMemo(() => {
    const itemSales = new Map<string, { name: string; sales: number; revenue: number }>();

    for (const order of orders) {
      if (!["PAID", "COMPLETED"].includes(order.status)) continue;
      for (const item of order.items) {
        const dishId = item.dishId;
        const current = itemSales.get(dishId) || {
          name: dishNameById[dishId] || dishId,
          sales: 0,
          revenue: 0,
        };
        current.sales += item.quantity;
        current.revenue += item.quantity * item.pricePerUnit;
        itemSales.set(dishId, current);
      }
    }

    const sorted = Array.from(itemSales.values())
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 4);

    return sorted;
  }, [orders, dishNameById]);

  const computedRecentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((order) => {
        const time = new Date(order.createdAt).toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        });

        const itemsSummary = order.items
          .map((item) => `${item.quantity}x ${dishNameById[item.dishId] || "Món"}`)
          .join(", ");

        return {
          id: `#${order.id.slice(-4).toUpperCase()}`,
          table: tableNameById[order.tableId] || `Bàn ${order.tableId.slice(-3).toUpperCase()}`,
          time,
          items: itemsSummary,
          total: order.finalPrice || order.totalPrice,
          status: order.status,
          realId: order.id,
        };
      });
  }, [orders, dishNameById, tableNameById]);

  if (token === undefined) {
    return <LoadingState label="Đang kiểm tra phiên đăng nhập..." />;
  }

  if (!token) {
    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 p-8 rounded-2xl text-center">
          <h1 className="text-xl font-semibold text-foreground">Cần đăng nhập</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Vui lòng đăng nhập bằng tài khoản ADMIN để xem dashboard doanh thu.
          </p>
          <Button asChild className="mt-5">
            <Link href="/login">Đăng nhập</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Filter & Control bar */}
      <section className="border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 rounded-2xl flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100">
            Thống kê & Báo cáo
          </h2>
          <p className="text-sm text-muted-foreground">
            Chọn ngày để cập nhật các số liệu thống kê.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
            onChange={(event) => setSelectedDate(event.target.value)}
            type="date"
            value={selectedDate}
          />
          <Button
            disabled={isLoading}
            onClick={retryDashboard}
            type="button"
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <RefreshCw size={14} />
            Tải lại
          </Button>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-border bg-card p-5">
          <ErrorState message={error} />
          <Button className="mt-4" onClick={retryDashboard} type="button">
            Thử lại
          </Button>
        </div>
      ) : null}
      {isLoading ? (
        <AdminDashboardSkeleton showColdStartMessage={showColdStartMessage} />
      ) : null}

      {!isLoading && !error && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatCard
              title="Doanh thu hôm nay"
              value={formatCurrency(dailyRevenue ?? summary?.totalRevenue ?? 0)}
              trend={15.2}
              icon={ReceiptText}
              colorClass="bg-gradient-to-br from-orange-400 to-orange-600 shadow-orange-200"
            />
            <StatCard
              title="Tổng Đơn hàng"
              value={formatNumber(summary?.totalOrders ?? 0)}
              trend={8.5}
              icon={UtensilsCrossed}
              colorClass="bg-gradient-to-br from-blue-400 to-blue-600 shadow-blue-200"
            />
            <StatCard
              title="Giá trị TB/Đơn"
              value={formatCurrency(summary?.averageOrderValue ?? 0)}
              trend={-2.4}
              icon={TrendingUp}
              colorClass="bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-200"
            />
            <StatCard
              title="Bàn đang phục vụ"
              value={tablesServingText}
              trend={5.0}
              icon={Users}
              colorClass="bg-gradient-to-br from-purple-400 to-purple-600 shadow-purple-200"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart: Revenue */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 lg:col-span-2">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">Doanh thu 7 ngày qua</h3>
                <select className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm rounded-lg px-3 py-1.5 outline-none text-gray-600 dark:text-slate-300">
                  <option>Tuần này</option>
                  <option>Tháng này</option>
                </select>
              </div>
              <div className="h-[250px] md:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={computedRevenueData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" className="dark:stroke-slate-800" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 12 }} dy={10} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9ca3af", fontSize: 12 }}
                      tickFormatter={(value) => `${value / 1000000}M`}
                      dx={-10}
                    />
                    <Tooltip
                      formatter={(value: unknown) => formatCurrency(Number(value))}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        backgroundColor: "#1e293b",
                        color: "#fff",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#f97316"
                      strokeWidth={4}
                      dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                      activeDot={{ r: 8, strokeWidth: 0, fill: "#f97316" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Items */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col">
              <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-6">Món bán chạy nhất</h3>
              <div className="space-y-5 flex-1">
                {computedTopItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Chưa có dữ liệu món bán chạy từ đơn đã thanh toán.
                  </p>
                ) : null}
                {computedTopItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div
                      className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300"
                          : index === 1
                          ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                          : index === 2
                          ? "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300"
                          : "bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      #{index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-800 dark:text-slate-200 truncate">{item.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{item.sales} phần đã bán</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-800 dark:text-slate-200">{formatCurrency(item.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button asChild variant="outline" className="w-full mt-6">
                <Link href="/admin/dishes">Xem toàn bộ Menu</Link>
              </Button>
            </div>
          </div>

          {/* Recent Orders Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
              <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">Đơn hàng hiện tại</h3>
              <Button asChild variant="link" size="sm" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                <Link href="/staff/orders">Xem tất cả</Link>
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-slate-800/40">
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Mã đơn</th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Bàn/Giờ</th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Món ăn</th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Tổng tiền</th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Trạng thái</th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {computedRecentOrders.length === 0 ? (
                    <tr>
                      <td
                        className="px-6 py-8 text-center text-sm text-muted-foreground"
                        colSpan={6}
                      >
                        Chưa có đơn hàng hiện tại.
                      </td>
                    </tr>
                  ) : null}
                  {computedRecentOrders.map((order, index) => (
                    <tr key={index} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6">
                        <span className="font-semibold text-gray-800 dark:text-slate-200">{order.id}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-orange-600 dark:text-orange-400">{order.table}</span>
                          <span className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock size={12} /> {order.time}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 max-w-xs">
                        <p className="text-sm text-gray-700 dark:text-slate-300 truncate" title={order.items}>
                          {order.items}
                        </p>
                      </td>
                      <td className="py-4 px-6 font-medium text-gray-800 dark:text-slate-200">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Button asChild variant="ghost" size="icon" className="text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-slate-800">
                          <Link href="/staff/orders">
                            <MoreVertical size={20} />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
