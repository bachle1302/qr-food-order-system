import { apiFetch } from "@/shared/api/client";
import { endpoints } from "@/shared/api/endpoints";
import type {
  AdminTable,
  TablePayload,
  TableQrTokenResponse,
} from "../types";

export function getTables(token: string) {
  return apiFetch<AdminTable[]>(endpoints.tables.list, {
    token,
    cache: "no-store",
  });
}

export function createTable(payload: TablePayload, token: string) {
  return apiFetch<AdminTable>(endpoints.tables.create, {
    method: "POST",
    body: payload,
    token,
    cache: "no-store",
  });
}

export function updateTable(
  tableId: string,
  payload: TablePayload,
  token: string,
) {
  return apiFetch<AdminTable>(endpoints.tables.byId(tableId), {
    method: "PUT",
    body: payload,
    token,
    cache: "no-store",
  });
}

export function deleteTable(tableId: string, token: string) {
  return apiFetch<void>(endpoints.tables.byId(tableId), {
    method: "DELETE",
    token,
    cache: "no-store",
  });
}

export function regenerateQrToken(tableId: string, token: string) {
  return apiFetch<TableQrTokenResponse>(
    endpoints.tables.regenerateQrToken(tableId),
    {
      method: "POST",
      token,
      cache: "no-store",
    },
  );
}
