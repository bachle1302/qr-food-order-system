"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/shared/api/error";
import { EmptyState } from "@/shared/ui/empty-state";
import { createQrOrder } from "../api/public-order.client";
import type {
  OrderResponse,
  PublicOrderDraftItem,
  TableQrInfo,
} from "../types";
import type { Category, Dish } from "@/features/menu/types";

type CustomerOrderClientProps = {
  qrToken: string;
  table: TableQrInfo;
  categories: Category[];
  dishes: Dish[];
};

type CartLine = PublicOrderDraftItem;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function getSubmitErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Khong the tao order. Vui long thu lai.";
}

export function CustomerOrderClient({
  qrToken,
  table,
  categories,
  dishes,
}: CustomerOrderClientProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [orderNote, setOrderNote] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<OrderResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableDishes = useMemo(
    () => dishes.filter((dish) => dish.available),
    [dishes],
  );

  const visibleDishes = useMemo(() => {
    if (selectedCategoryId === "all") {
      return availableDishes;
    }

    return availableDishes.filter(
      (dish) => dish.categoryId === selectedCategoryId,
    );
  }, [availableDishes, selectedCategoryId]);

  const cartWithDishes = useMemo(
    () =>
      cart
        .map((item) => ({
          ...item,
          dish: dishes.find((dish) => dish.id === item.dishId),
        }))
        .filter((item) => item.dish),
    [cart, dishes],
  );

  const previewTotal = cartWithDishes.reduce(
    (sum, item) => sum + (item.dish?.price ?? 0) * item.quantity,
    0,
  );

  function updateQuantity(dishId: string, quantity: number) {
    setSubmitError(null);
    setSuccessOrder(null);
    setCart((current) => {
      if (quantity <= 0) {
        return current.filter((item) => item.dishId !== dishId);
      }

      const existing = current.find((item) => item.dishId === dishId);
      if (!existing) {
        return [...current, { dishId, quantity }];
      }

      return current.map((item) =>
        item.dishId === dishId ? { ...item, quantity } : item,
      );
    });
  }

  function updateItemNote(dishId: string, note: string) {
    setCart((current) =>
      current.map((item) =>
        item.dishId === dishId ? { ...item, note } : item,
      ),
    );
  }

  function getQuantity(dishId: string) {
    return cart.find((item) => item.dishId === dishId)?.quantity ?? 0;
  }

  async function handleSubmit() {
    if (cart.length === 0 || isSubmitting) {
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const order = await createQrOrder({
        qrToken,
        note: orderNote.trim() || undefined,
        items: cart.map((item) => ({
          dishId: item.dishId,
          quantity: item.quantity,
          note: item.note?.trim() || undefined,
        })),
      });

      setSuccessOrder(order);
      setCart([]);
      setOrderNote("");
    } catch (error) {
      setSubmitError(getSubmitErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (successOrder) {
    return (
      <section className="rounded-lg border border-border bg-card p-6">
        <p className="text-sm font-medium text-muted-foreground">
          Order created
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-foreground">
          Dat mon thanh cong
        </h2>
        <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
          <p>
            Ma don:{" "}
            <span className="font-medium text-foreground">
              {successOrder.id}
            </span>
          </p>
          <p>
            Trang thai:{" "}
            <span className="font-medium text-foreground">
              {successOrder.status}
            </span>
          </p>
        </div>
        <Button className="mt-6" onClick={() => setSuccessOrder(null)}>
          Tiep tuc xem menu
        </Button>
      </section>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="space-y-6">
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm font-medium text-muted-foreground">
            Ban hien tai
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">
            {table.name}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {table.seats} ghe · {table.available ? "Dang san sang" : "Tam khoa"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setSelectedCategoryId("all")}
            variant={selectedCategoryId === "all" ? "default" : "outline"}
          >
            Tat ca
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              onClick={() => setSelectedCategoryId(category.id)}
              variant={
                selectedCategoryId === category.id ? "default" : "outline"
              }
            >
              {category.name}
            </Button>
          ))}
        </div>

        {visibleDishes.length === 0 ? (
          <EmptyState
            title="Chua co mon phu hop"
            description="Khong co mon dang available trong bo loc hien tai."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {visibleDishes.map((dish) => {
              const quantity = getQuantity(dish.id);

              return (
                <article
                  className="rounded-lg border border-border bg-card p-5"
                  key={dish.id}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {dish.name}
                      </h3>
                      {dish.description ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {dish.description}
                        </p>
                      ) : null}
                    </div>
                    <p className="shrink-0 text-sm font-medium text-foreground">
                      {formatCurrency(dish.price)}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <Button
                      disabled={quantity === 0}
                      onClick={() => updateQuantity(dish.id, quantity - 1)}
                      size="sm"
                      variant="outline"
                    >
                      -
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">
                      {quantity}
                    </span>
                    <Button
                      onClick={() => updateQuantity(dish.id, quantity + 1)}
                      size="sm"
                      variant="outline"
                    >
                      +
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <aside className="h-fit rounded-lg border border-border bg-card p-5 lg:sticky lg:top-6">
        <h2 className="text-lg font-semibold text-foreground">Gio hang</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tong tien chi la preview. Backend se tinh tien that khi tao order.
        </p>

        {cartWithDishes.length === 0 ? (
          <div className="mt-4 rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
            Chua co mon nao trong gio.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {cartWithDishes.map((item) => (
              <div className="rounded-md border border-border p-3" key={item.dishId}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">
                      {item.dish?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} x {formatCurrency(item.dish?.price ?? 0)}
                    </p>
                  </div>
                  <Button
                    onClick={() => updateQuantity(item.dishId, 0)}
                    size="sm"
                    variant="outline"
                  >
                    Xoa
                  </Button>
                </div>
                <textarea
                  className="mt-3 min-h-16 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring placeholder:text-muted-foreground focus:ring-2"
                  onChange={(event) =>
                    updateItemNote(item.dishId, event.target.value)
                  }
                  placeholder="Ghi chu cho mon nay"
                  value={item.note ?? ""}
                />
              </div>
            ))}
          </div>
        )}

        <label className="mt-5 block text-sm font-medium text-foreground">
          Ghi chu don hang
        </label>
        <textarea
          className="mt-2 min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring placeholder:text-muted-foreground focus:ring-2"
          onChange={(event) => setOrderNote(event.target.value)}
          placeholder="Vi du: it cay, phuc vu sau 10 phut..."
          value={orderNote}
        />

        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <span className="text-sm text-muted-foreground">Preview total</span>
          <span className="text-lg font-semibold text-foreground">
            {formatCurrency(previewTotal)}
          </span>
        </div>

        {submitError ? (
          <div className="mt-4 rounded-md border border-destructive/30 bg-card p-3 text-sm text-muted-foreground">
            {submitError}
          </div>
        ) : null}

        <Button
          className="mt-5 w-full"
          disabled={cart.length === 0 || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? "Dang gui..." : "Tao order"}
        </Button>
      </aside>
    </div>
  );
}
