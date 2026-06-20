import { apiFetch } from "@/shared/api/client";
import { endpoints } from "@/shared/api/endpoints";
import type {
  AdminDashboardResponse,
  DailySummary,
  DashboardOrder,
  DashboardOrderFilters,
} from "../types";

function buildManageQuery(params: DashboardOrderFilters = {}) {
  const query = new URLSearchParams();

  if (params.status && params.status !== "ALL") {
    query.set("status", params.status);
  }
  if (params.tableId) {
    query.set("tableId", params.tableId);
  }
  if (params.fromDate) {
    query.set("fromDate", params.fromDate);
  }
  if (params.toDate) {
    query.set("toDate", params.toDate);
  }

  const value = query.toString();
  return value ? `?${value}` : "";
}

export function getDailySummary(date: string, token: string) {
  const query = new URLSearchParams({ date });

  return apiFetch<DailySummary>(
    `${endpoints.orders.dailySummary}?${query.toString()}`,
    {
      cache: "no-store",
      token,
    },
  );
}

export function getDailyRevenue(date: string, token: string) {
  const query = new URLSearchParams({ date });

  return apiFetch<number>(
    `${endpoints.orders.dailyRevenue}?${query.toString()}`,
    {
      cache: "no-store",
      token,
    },
  );
}

export function getMonthlyRevenue(month: string, token: string) {
  const query = new URLSearchParams({ month });

  return apiFetch<number>(
    `${endpoints.orders.monthlyRevenue}?${query.toString()}`,
    {
      cache: "no-store",
      token,
    },
  );
}

export function getManagedOrders(
  params: DashboardOrderFilters,
  token: string,
) {
  return apiFetch<DashboardOrder[]>(
    `${endpoints.orders.manage}${buildManageQuery(params)}`,
    {
      cache: "no-store",
      token,
    },
  );
}

export function getAdminDashboard(date: string, token: string) {
  const query = new URLSearchParams({ date });

  return apiFetch<AdminDashboardResponse>(
    `${endpoints.admin.dashboard}?${query.toString()}`,
    {
      cache: "no-store",
      token,
    },
  );
}
