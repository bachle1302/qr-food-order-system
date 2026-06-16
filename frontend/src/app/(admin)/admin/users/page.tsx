import { AdminUsersPage as AdminUsersFeature } from "@/features/admin/users/components/admin-users-page";
import { AppShell } from "@/shared/ui/app-shell";

export default function AdminUsersPage() {
  return (
    <AppShell
      title="Quan ly nhan vien"
      description="Tao STAFF, loc role va cap nhat thong tin tai khoan."
    >
      <AdminUsersFeature />
    </AppShell>
  );
}
