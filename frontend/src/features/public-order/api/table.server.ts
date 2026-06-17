import { endpoints } from "@/shared/api/endpoints";
import { serverApiFetch } from "@/shared/api/server";
import type { TableQrInfo } from "../types";

export function getTableByQrToken(qrToken: string) {
  return serverApiFetch<TableQrInfo>(endpoints.tables.byQrToken(qrToken), {
    cache: "no-store",
  });
}
