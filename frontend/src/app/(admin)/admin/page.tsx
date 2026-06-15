import { AppShell } from "@/shared/ui/app-shell";
import { EmptyState } from "@/shared/ui/empty-state";

export default function AdminPage() {
  return (
    <AppShell
      title="Admin dashboard"
      description="Placeholder cho khu vuc quan tri QR Food/RMS."
    >
      <EmptyState
        title="Admin dashboard chua implement"
        description="Task sau se ket noi cac API quan ly ban, mon, danh muc, giam gia, user va doanh thu neu backend ho tro."
      />
    </AppShell>
  );
}
