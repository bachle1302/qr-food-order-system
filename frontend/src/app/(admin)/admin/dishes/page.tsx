import { AppShell } from "@/shared/ui/app-shell";
import { EmptyState } from "@/shared/ui/empty-state";

export default function AdminDishesPage() {
  return (
    <AppShell title="Admin dishes" description="Placeholder cho quan ly mon an.">
      <EmptyState
        title="Quan ly mon chua implement"
        description="Task sau se dung CRUD /api/dishes va khong bia field ngoai DTO backend."
      />
    </AppShell>
  );
}
