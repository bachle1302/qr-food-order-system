import { StaffOrdersDashboard } from "@/features/orders/components/staff-orders-dashboard";
import { AppShell } from "@/shared/ui/app-shell";

export default function StaffOrdersPage() {
  return (
    <AppShell
      title="Staff orders"
      description="Nhan vien xem order, cap nhat trang thai va nhan realtime event."
    >
      <StaffOrdersDashboard />
    </AppShell>
  );
}
