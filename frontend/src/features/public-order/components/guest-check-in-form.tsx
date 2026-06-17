"use client";

import { FormEvent, useState } from "react";
import { Loader2, Phone, ScanLine, Store, UserRound, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/shared/api/error";
import { checkInCustomer } from "../api/customer-session.client";
import type { CustomerSession } from "../types";

type GuestCheckInFormProps = {
  qrToken: string;
  tableName: string;
  message?: string | null;
  onCheckedIn: (session: CustomerSession) => void;
};

function getCheckInErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Không thể check-in. Vui lòng thử lại.";
}

export function GuestCheckInForm({
  qrToken,
  tableName,
  message,
  onCheckedIn,
}: GuestCheckInFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      setError("Vui lòng nhập tên để nhân viên nhận diện đơn.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const session = await checkInCustomer({
        qrToken,
        name: trimmedName,
        phone: trimmedPhone || undefined,
      });

      onCheckedIn(session);
    } catch (checkInError) {
      setError(getCheckInErrorMessage(checkInError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-muted/40 text-foreground">
      <section className="mx-auto flex min-h-screen max-w-[520px] flex-col justify-center bg-background px-5 py-8">
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              <ScanLine className="size-3.5" />
              Quét QR tại bàn
            </div>
            <div className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Utensils className="size-5" />
            </div>
          </div>

          <div className="mt-7">
            <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Store className="size-4" />
              {tableName || "Bàn của bạn"}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              Bạn muốn đặt món?
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Nhập tên để nhân viên biết ai đang đặt món và phục vụ đúng đơn
              của bạn.
            </p>
          </div>

          <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
            {message ? (
              <div className="rounded-lg border border-border bg-muted p-3 text-sm text-muted-foreground">
                {message}
              </div>
            ) : null}

            <label className="block text-sm font-medium text-foreground">
              Tên khách hàng
              <span className="text-destructive"> *</span>
              <span className="relative mt-2 block">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  autoComplete="name"
                  className="h-12 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  disabled={isSubmitting}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ví dụ: Anh Minh"
                  value={name}
                />
              </span>
            </label>

            <label className="block text-sm font-medium text-foreground">
              Số điện thoại
              <span className="ml-1 text-muted-foreground">
                (không bắt buộc)
              </span>
              <span className="relative mt-2 block">
                <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  autoComplete="tel"
                  className="h-12 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  disabled={isSubmitting}
                  inputMode="tel"
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="Ví dụ: 0901234567"
                  value={phone}
                />
              </span>
            </label>

            {error ? (
              <div className="rounded-lg border border-destructive/30 bg-background p-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <Button className="h-12 w-full rounded-lg" disabled={isSubmitting} type="submit">
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Đang check-in
                </>
              ) : (
                "Bắt đầu đặt món"
              )}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
