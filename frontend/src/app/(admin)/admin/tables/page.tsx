import { endpoints } from "@/shared/api/endpoints";
import { AppShell } from "@/shared/ui/app-shell";
import { EmptyState } from "@/shared/ui/empty-state";

export default function AdminTablesPage() {
  return (
    <AppShell
      title="Admin tables"
      description="Placeholder cho quan ly ban va QR token."
    >
      <EmptyState
        title="Quan ly ban chua implement"
        description={`Task sau se dung CRUD /api/tables va ${endpoints.tables.regenerateQrToken("{tableId}")}.`}
      />
    </AppShell>
  );
}
