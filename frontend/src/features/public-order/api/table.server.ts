import { endpoints } from "@/shared/api/endpoints";
import { serverApiFetch } from "@/shared/api/server";
import type { TableQrInfo } from "../types";

export function getTableByQrToken(qrToken: string) {
  return serverApiFetch<TableQrInfo>(endpoints.tables.byQrToken(qrToken), {
    next: { revalidate: 60, tags: [`table-qr-${qrToken}`] },
  });
}
