import { AppShell } from "@/shared/ui/app-shell";
import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <AppShell
      title="Staff/Admin login"
      description="Placeholder cho form dang nhap JWT Bearer token."
    >
      <LoginForm />
    </AppShell>
  );
}
