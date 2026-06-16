"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, Plus, RefreshCw, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/shared/api/error";
import { getAccessToken } from "@/shared/auth/token-storage";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { LoadingState } from "@/shared/ui/loading-state";
import {
  createTable,
  deleteTable,
  getTables,
  regenerateQrToken,
  updateTable,
} from "../api/tables.client";
import type { AdminTable, TablePayload } from "../types";

type FormState = {
  id?: string;
  name: string;
  seats: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  seats: "2",
};

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      return "Phien dang nhap het han hoac khong co quyen truy cap.";
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Khong the xu ly yeu cau quan ly ban.";
}

function toPayload(form: FormState): TablePayload {
  const name = form.name.trim();
  const seats = Number(form.seats);

  if (!name) {
    throw new Error("Ten ban khong duoc de trong.");
  }

  if (!Number.isInteger(seats) || seats <= 0) {
    throw new Error("So ghe phai la so nguyen lon hon 0.");
  }

  return { name, seats };
}

function upsertTable(tables: AdminTable[], nextTable: AdminTable) {
  const existing = tables.find((table) => table.id === nextTable.id);
  if (!existing) {
    return [nextTable, ...tables];
  }

  return tables.map((table) =>
    table.id === nextTable.id
      ? { ...nextTable, qrToken: nextTable.qrToken ?? table.qrToken }
      : table,
  );
}

function buildQrPath(qrToken: string) {
  return `/qr/${encodeURIComponent(qrToken)}`;
}

export function AdminTablesPage() {
  const [token, setToken] = useState<string | null>(null);
  const [tables, setTables] = useState<AdminTable[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTableId, setActiveTableId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isEditing = Boolean(form.id);

  const sortedTables = useMemo(
    () => [...tables].sort((a, b) => a.name.localeCompare(b.name)),
    [tables],
  );

  const loadTables = useCallback(async (accessToken: string) => {
    setError(null);
    const response = await getTables(accessToken);
    setTables(response);
  }, []);

  useEffect(() => {
    async function load() {
      const accessToken = getAccessToken();
      setToken(accessToken);

      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        await loadTables(accessToken);
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [loadTables]);

  function resetForm() {
    setForm(EMPTY_FORM);
  }

  function startEdit(table: AdminTable) {
    setForm({
      id: table.id,
      name: table.name,
      seats: String(table.seats),
    });
    setError(null);
    setNotice(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setError("Vui long dang nhap bang tai khoan ADMIN.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const payload = toPayload(form);
      const saved = form.id
        ? await updateTable(form.id, payload, token)
        : await createTable(payload, token);

      setTables((current) => upsertTable(current, saved));
      setNotice(form.id ? "Da cap nhat ban." : "Da tao ban moi.");
      resetForm();
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegenerate(tableId: string) {
    if (!token) {
      setError("Vui long dang nhap bang tai khoan ADMIN.");
      return;
    }

    setActiveTableId(tableId);
    setError(null);
    setNotice(null);

    try {
      const response = await regenerateQrToken(tableId, token);
      setTables((current) =>
        current.map((table) =>
          table.id === response.tableId
            ? { ...table, qrToken: response.qrToken }
            : table,
        ),
      );
      setNotice("Da regenerate QR token.");
    } catch (regenerateError) {
      setError(getErrorMessage(regenerateError));
    } finally {
      setActiveTableId(null);
    }
  }

  async function handleDelete(tableId: string) {
    if (!token) {
      setError("Vui long dang nhap bang tai khoan ADMIN.");
      return;
    }

    if (!window.confirm("Xoa ban nay?")) {
      return;
    }

    setActiveTableId(tableId);
    setError(null);
    setNotice(null);

    try {
      await deleteTable(tableId, token);
      setTables((current) => current.filter((table) => table.id !== tableId));
      if (form.id === tableId) {
        resetForm();
      }
      setNotice("Da xoa ban.");
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setActiveTableId(null);
    }
  }

  async function handleCopy(qrToken?: string) {
    if (!qrToken) {
      setError("Chua co qrToken trong response. Hay regenerate token truoc.");
      return;
    }

    const qrLink = `${window.location.origin}${buildQrPath(qrToken)}`;
    await window.navigator.clipboard.writeText(qrLink);
    setNotice("Da copy QR link.");
    setError(null);
  }

  if (!token) {
    return (
      <div className="space-y-4">
        <EmptyState
          title="Can dang nhap"
          description="Vui long dang nhap bang tai khoan ADMIN de quan ly ban."
        />
        <Button asChild>
          <Link href="/login">Dang nhap</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {isEditing ? "Sua ban" : "Tao ban moi"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Backend hien nhan name va seats; available la trang thai doc.
            </p>
          </div>
          {isEditing ? (
            <Button onClick={resetForm} type="button" variant="outline">
              <X />
              Huy sua
            </Button>
          ) : null}
        </div>

        <form
          className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_140px_auto]"
          onSubmit={handleSubmit}
        >
          <label className="grid gap-1 text-sm text-foreground">
            Ten ban
            <input
              className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="Ban 4"
              value={form.name}
            />
          </label>
          <label className="grid gap-1 text-sm text-foreground">
            So ghe
            <input
              className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              min={1}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  seats: event.target.value,
                }))
              }
              type="number"
              value={form.seats}
            />
          </label>
          <div className="flex items-end">
            <Button disabled={isSubmitting} type="submit">
              {isEditing ? <Save /> : <Plus />}
              {isEditing ? "Luu" : "Tao ban"}
            </Button>
          </div>
        </form>
      </section>

      {notice ? (
        <div className="rounded-lg border border-border bg-muted p-3 text-sm text-foreground">
          {notice}
        </div>
      ) : null}

      {error ? <ErrorState message={error} /> : null}
      {isLoading ? <LoadingState label="Dang tai danh sach ban..." /> : null}

      {!isLoading && sortedTables.length === 0 ? (
        <EmptyState
          title="Chua co ban"
          description="Tao ban moi de bat dau quan ly QR order."
        />
      ) : null}

      <div className="grid gap-4">
        {sortedTables.map((table) => {
          const qrPath = table.qrToken ? buildQrPath(table.qrToken) : null;
          const isActive = activeTableId === table.id;

          return (
            <article
              className="rounded-lg border border-border bg-card p-4"
              key={table.id}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-2">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      {table.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {table.seats} ghe ·{" "}
                      {table.available ? "available" : "not available"}
                    </p>
                  </div>

                  <div className="grid gap-1 text-sm">
                    <span className="text-muted-foreground">qrToken</span>
                    <code className="break-all rounded-md border border-border bg-muted px-2 py-1 text-xs text-foreground">
                      {table.qrToken ??
                        "Khong co trong TableResponse. Regenerate de lay token moi."}
                    </code>
                  </div>

                  <div className="grid gap-1 text-sm">
                    <span className="text-muted-foreground">QR frontend</span>
                    {qrPath ? (
                      <Link
                        className="break-all rounded-md border border-border bg-background px-2 py-1 text-xs text-primary hover:bg-muted"
                        href={qrPath}
                      >
                        {qrPath}
                      </Link>
                    ) : (
                      <span className="rounded-md border border-border bg-muted px-2 py-1 text-xs text-muted-foreground">
                        Chua co QR link de hien thi.
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={!table.qrToken}
                    onClick={() => handleCopy(table.qrToken)}
                    type="button"
                    variant="outline"
                  >
                    <Copy />
                    Copy
                  </Button>
                  <Button
                    disabled={isActive}
                    onClick={() => handleRegenerate(table.id)}
                    type="button"
                    variant="outline"
                  >
                    <RefreshCw />
                    Regenerate
                  </Button>
                  <Button
                    onClick={() => startEdit(table)}
                    type="button"
                    variant="outline"
                  >
                    Sua
                  </Button>
                  <Button
                    disabled={isActive}
                    onClick={() => handleDelete(table.id)}
                    type="button"
                    variant="destructive"
                  >
                    <Trash2 />
                    Xoa
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
