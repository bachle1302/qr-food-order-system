"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/shared/api/error";
import { setTokens, setUserRole } from "@/shared/auth/token-storage";
import { login } from "../api/auth.client";

function getLoginError(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Đăng nhập thất bại.";
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const auth = await login({ email, password });
      setTokens({
        accessToken: auth.accessToken,
        refreshToken: auth.refreshToken,
      });
      setUserRole(auth.user.role);
      
      if (auth.user.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/staff/orders");
      }
    } catch (loginError) {
      setError(getLoginError(loginError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="mx-auto max-w-md rounded-lg border border-border bg-card p-6"
      onSubmit={handleSubmit}
    >
      <div>
        <label className="text-sm font-medium text-foreground" htmlFor="email">
          Email
        </label>
        <input
          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring placeholder:text-muted-foreground focus:ring-2"
          id="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </div>
      <div className="mt-4">
        <label
          className="text-sm font-medium text-foreground"
          htmlFor="password"
        >
          Password
        </label>
        <input
          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring placeholder:text-muted-foreground focus:ring-2"
          id="password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </div>
      {error ? (
        <div className="mt-4 rounded-md border border-destructive/30 bg-card p-3 text-sm text-muted-foreground">
          {error}
        </div>
      ) : null}
      <Button className="mt-5 w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Dang dang nhap..." : "Dang nhap"}
      </Button>
    </form>
  );
}
