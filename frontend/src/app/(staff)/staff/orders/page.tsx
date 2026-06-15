import { endpoints } from "@/shared/api/endpoints";
import { AppShell } from "@/shared/ui/app-shell";
import { EmptyState } from "@/shared/ui/empty-state";

export default function StaffOrdersPage() {
  return (
    <AppShell
      title="Staff orders"
      description="Placeholder cho man hinh nhan vien quan ly don hang."
    >
      <EmptyState
        title="Danh sach order chua implement"
        description={`Task sau se goi ${endpoints.orders.manage}, ${endpoints.orders.manageNew} va ${endpoints.orders.updateStatus("{orderId}")}.`}
      />
    </AppShell>
  );
}
