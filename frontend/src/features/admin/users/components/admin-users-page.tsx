"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Plus, Save, UserCheck, UserX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/shared/api/error";
import { getAccessToken } from "@/shared/auth/token-storage";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { LoadingState } from "@/shared/ui/loading-state";
import {
  createStaff,
  getUsersByRole,
  updateUser,
  updateUserActiveStatus,
} from "../api/users.client";
import type { AdminUser, UserRole } from "../types";

type RoleFilter = "ALL" | UserRole;

type CreateFormState = {
  email: string;
  password: string;
  displayName: string;
};

type EditFormState = {
  id?: string;
  email: string;
  displayName: string;
  avatar: string;
};

const EMPTY_CREATE_FORM: CreateFormState = {
  email: "",
  password: "",
  displayName: "",
};

const EMPTY_EDIT_FORM: EditFormState = {
  email: "",
  displayName: "",
  avatar: "",
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

  return "Khong the xu ly yeu cau quan ly nhan vien.";
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function upsertUser(users: AdminUser[], nextUser: AdminUser) {
  if (!users.some((user) => user.id === nextUser.id)) {
    return [nextUser, ...users];
  }

  return users.map((user) =>
    user.id === nextUser.id
      ? {
          ...user,
          ...nextUser,
          isActive: nextUser.isActive ?? user.isActive,
          updatedAt: nextUser.updatedAt ?? user.updatedAt,
        }
      : user,
  );
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Khong co trong response";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function AdminUsersPage() {
  const [token, setToken] = useState<string | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [createForm, setCreateForm] =
    useState<CreateFormState>(EMPTY_CREATE_FORM);
  const [editForm, setEditForm] = useState<EditFormState>(EMPTY_EDIT_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isEditing = Boolean(editForm.id);

  const sortedUsers = useMemo(
    () =>
      [...users].sort((a, b) =>
        (a.email ?? "").localeCompare(b.email ?? "", "vi"),
      ),
    [users],
  );

  const loadUsers = useCallback(
    async (accessToken: string, role: RoleFilter) => {
      setError(null);
      const response = await getUsersByRole(role, accessToken);
      setUsers(response);
    },
    [],
  );

  useEffect(() => {
    async function loadToken() {
      const accessToken = getAccessToken();
      setToken(accessToken);
      setIsLoading(false);
    }

    loadToken();
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    const accessToken = token;

    async function load() {
      setIsLoading(true);
      try {
        await loadUsers(accessToken, roleFilter);
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [loadUsers, roleFilter, token]);

  function resetEditForm() {
    setEditForm(EMPTY_EDIT_FORM);
  }

  function startEdit(user: AdminUser) {
    setEditForm({
      id: user.id,
      email: user.email,
      displayName: user.displayName ?? "",
      avatar: user.avatar ?? "",
    });
    setError(null);
    setNotice(null);
  }

  async function handleCreateStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setError("Vui long dang nhap bang tai khoan ADMIN.");
      return;
    }

    const email = createForm.email.trim();
    const password = createForm.password;
    const displayName = createForm.displayName.trim();

    if (!email || !isEmail(email)) {
      setError("Email khong hop le.");
      return;
    }

    if (!password) {
      setError("Password khong duoc de trong.");
      return;
    }

    if (!displayName) {
      setError("Display name khong duoc de trong.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const created = await createStaff(
        { email, password, displayName, role: "STAFF" },
        token,
      );
      setUsers((current) => upsertUser(current, created));
      setCreateForm(EMPTY_CREATE_FORM);
      setNotice("Da tao tai khoan STAFF.");
    } catch (createError) {
      setError(getErrorMessage(createError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || !editForm.id) {
      setError("Vui long chon user can sua.");
      return;
    }

    const email = editForm.email.trim();
    const displayName = editForm.displayName.trim();
    const avatar = editForm.avatar.trim();

    if (email && !isEmail(email)) {
      setError("Email khong hop le.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const updated = await updateUser(
        editForm.id,
        { email, displayName, avatar },
        token,
      );
      setUsers((current) => upsertUser(current, updated));
      resetEditForm();
      setNotice("Da cap nhat user.");
    } catch (updateError) {
      setError(getErrorMessage(updateError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateStatus(user: AdminUser, isActive: boolean) {
    if (!token) {
      setError("Vui long dang nhap bang tai khoan ADMIN.");
      return;
    }

    setActiveUserId(user.id);
    setError(null);
    setNotice(null);

    try {
      const updated = await updateUserActiveStatus(user.id, isActive, token);
      setUsers((current) =>
        upsertUser(current, { ...updated, isActive }),
      );
      setNotice(isActive ? "Da kich hoat user." : "Da vo hieu hoa user.");
    } catch (statusError) {
      setError(getErrorMessage(statusError));
    } finally {
      setActiveUserId(null);
    }
  }

  if (!token) {
    return (
      <div className="space-y-4">
        <EmptyState
          title="Can dang nhap"
          description="Vui long dang nhap bang tai khoan ADMIN de quan ly nhan vien."
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
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Tao tai khoan STAFF
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Role duoc co dinh la STAFF; backend khong cho tao ADMIN qua API nay.
          </p>
        </div>

        <form
          className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_180px_auto]"
          onSubmit={handleCreateStaff}
        >
          <label className="grid gap-1 text-sm text-foreground">
            Email
            <input
              className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              placeholder="staff@example.com"
              value={createForm.email}
            />
          </label>
          <label className="grid gap-1 text-sm text-foreground">
            Display name
            <input
              className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  displayName: event.target.value,
                }))
              }
              placeholder="Staff Demo"
              value={createForm.displayName}
            />
          </label>
          <label className="grid gap-1 text-sm text-foreground">
            Password
            <input
              className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              type="password"
              value={createForm.password}
            />
          </label>
          <div className="flex items-end">
            <Button disabled={isSubmitting} type="submit">
              <Plus />
              Tao STAFF
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {isEditing ? "Sua user" : "Chon user de sua"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Form nay chi sua email, displayName va avatar. Khong sua role hoac password.
            </p>
          </div>
          {isEditing ? (
            <Button onClick={resetEditForm} type="button" variant="outline">
              <X />
              Huy sua
            </Button>
          ) : null}
        </div>

        <form
          className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
          onSubmit={handleUpdateUser}
        >
          <label className="grid gap-1 text-sm text-foreground">
            Email
            <input
              className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={!isEditing}
              onChange={(event) =>
                setEditForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              value={editForm.email}
            />
          </label>
          <label className="grid gap-1 text-sm text-foreground">
            Display name
            <input
              className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
              disabled={!isEditing}
              onChange={(event) =>
                setEditForm((current) => ({
                  ...current,
                  displayName: event.target.value,
                }))
              }
              value={editForm.displayName}
            />
          </label>
          <label className="grid gap-1 text-sm text-foreground">
            Avatar URL
            <input
              className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
              disabled={!isEditing}
              onChange={(event) =>
                setEditForm((current) => ({
                  ...current,
                  avatar: event.target.value,
                }))
              }
              value={editForm.avatar}
            />
          </label>
          <div className="flex items-end">
            <Button disabled={!isEditing || isSubmitting} type="submit">
              <Save />
              Luu
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <label className="grid gap-1 text-sm text-foreground sm:max-w-xs">
          Loc theo role
          <select
            className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) =>
              setRoleFilter(event.target.value as RoleFilter)
            }
            value={roleFilter}
          >
            <option value="ALL">ALL</option>
            <option value="ADMIN">ADMIN</option>
            <option value="STAFF">STAFF</option>
          </select>
        </label>
      </section>

      {notice ? (
        <div className="rounded-lg border border-border bg-muted p-3 text-sm text-foreground">
          {notice}
        </div>
      ) : null}

      {error ? <ErrorState message={error} /> : null}
      {isLoading ? <LoadingState label="Dang tai danh sach user..." /> : null}

      {!isLoading && sortedUsers.length === 0 ? (
        <EmptyState
          title="Chua co user"
          description="Khong co user nao phu hop bo loc hien tai."
        />
      ) : null}

      <div className="grid gap-4">
        {sortedUsers.map((user) => {
          const isActiveAction = activeUserId === user.id;
          const activeLabel =
            typeof user.isActive === "boolean"
              ? user.isActive
                ? "active"
                : "inactive"
              : "isActive khong co trong response";

          return (
            <article
              className="rounded-lg border border-border bg-card p-4"
              key={user.id}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-2">
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {user.displayName || "Chua co ten hien thi"}
                    </h3>
                    <p className="break-all text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-md border border-border bg-muted px-2 py-1 text-foreground">
                      {user.role}
                    </span>
                    <span className="rounded-md border border-border bg-muted px-2 py-1 text-foreground">
                      {activeLabel}
                    </span>
                    <span className="rounded-md border border-border bg-muted px-2 py-1 text-muted-foreground">
                      createdAt: {formatDate(user.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => startEdit(user)}
                    type="button"
                    variant="outline"
                  >
                    Sua
                  </Button>
                  <Button
                    disabled={isActiveAction}
                    onClick={() => handleUpdateStatus(user, true)}
                    type="button"
                    variant="outline"
                  >
                    <UserCheck />
                    Active
                  </Button>
                  <Button
                    disabled={isActiveAction}
                    onClick={() => handleUpdateStatus(user, false)}
                    type="button"
                    variant="destructive"
                  >
                    <UserX />
                    Inactive
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
