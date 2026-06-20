import type { Order, OrderStatus } from "@/features/orders/types";

export type DailySummary = {
  date: string;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  orderIds: string[];
};

export type DashboardOrder = Order;

export type DashboardOrderFilters = {
  status?: OrderStatus | "ALL";
  tableId?: string;
  fromDate?: string;
  toDate?: string;
};

export type AdminDashboardRevenuePoint = {
  name: string;
  date: string;
  revenue: number;
};

export type AdminDashboardTopItem = {
  dishId: string;
  name: string;
  sales: number;
  revenue: number;
};

export type AdminDashboardRecentOrderItem = {
  dishId: string;
  dishName: string;
  quantity: number;
  pricePerUnit?: number | null;
};

export type AdminDashboardRecentOrder = {
  id: string;
  tableId: string;
  tableName?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  status: OrderStatus;
  totalPrice?: number | null;
  finalPrice?: number | null;
  createdAt: string;
  items: AdminDashboardRecentOrderItem[];
};

export type AdminDashboardResponse = {
  date: string;
  totalOrders: number;
  todayOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  todayRevenue: number;
  monthRevenue: number;
  averageOrderValue: number;
  totalTables: number;
  activeTables: number;
  totalDishes: number;
  totalUsers: number;
  ordersByStatus: Array<{
    status: string;
    count: number;
  }>;
  revenueSeries: AdminDashboardRevenuePoint[];
  topItems: AdminDashboardTopItem[];
  recentOrders: AdminDashboardRecentOrder[];
};
