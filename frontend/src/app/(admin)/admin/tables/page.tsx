import { AdminTablesPage as AdminTablesFeature } from "@/features/admin/tables/components/admin-tables-page";
import { AppShell } from "@/shared/ui/app-shell";

export default function AdminTablesPage() {
  return (
    <AppShell
      title="Quan ly ban"
      description="Tao ban, cap nhat thong tin ban va quan ly QR token."
    >
      <AdminTablesFeature />
    </AppShell>
  );
}
