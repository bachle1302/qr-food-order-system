import { endpoints } from "@/shared/api/endpoints";
import { AppShell } from "@/shared/ui/app-shell";
import { EmptyState } from "@/shared/ui/empty-state";

export default function LoginPage() {
  return (
    <AppShell
      title="Staff/Admin login"
      description="Placeholder cho form dang nhap JWT Bearer token."
    >
      <EmptyState
        title="Login form chua implement"
        description={`Task sau se goi API that ${endpoints.auth.login} va luu token qua token-storage.`}
      />
    </AppShell>
  );
}
