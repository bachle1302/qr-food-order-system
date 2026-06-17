import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "./theme-toggle";

type AppShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

const navItems = [
  { href: "/", label: "Home" },
  { href: "/qr/demo-token", label: "QR demo" },
  { href: "/login", label: "Login" },
  { href: "/staff/orders", label: "Staff" },
  { href: "/admin", label: "Admin" },
];

export function AppShell({ title, description, children }: AppShellProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              QR Food/RMS
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {description ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <nav className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              {navItems.map((item) => (
                <Link
                  className="rounded-md px-2 py-1 hover:bg-muted hover:text-foreground"
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-4 py-8">{children}</section>
    </main>
  );
}
