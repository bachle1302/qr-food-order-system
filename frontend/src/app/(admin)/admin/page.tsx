import { AdminDashboardPage } from "@/features/admin/dashboard/components/admin-dashboard-page";
import { AppShell } from "@/shared/ui/app-shell";

export default function AdminPage() {
  return (
    <AppShell
      title="Tong quan quan tri"
      description="Theo doi don hang, doanh thu va cac loi tat van hanh QR Food/RMS."
    >
      <AdminDashboardPage />
    </AppShell>
  );
}
