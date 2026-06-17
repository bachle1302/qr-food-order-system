"use client";

import { useState } from "react";
import { Minus, Plus, Utensils, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Dish } from "@/features/menu/types";

type DishDetailSheetProps = {
  categoryName: string;
  dish: Dish | null;
  initialNote?: string;
  initialQuantity: number;
  onClose: () => void;
  onSave: (dishId: string, quantity: number, note?: string) => void;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export function DishDetailSheet({
  categoryName,
  dish,
  initialNote,
  initialQuantity,
  onClose,
  onSave,
}: DishDetailSheetProps) {
  const [quantity, setQuantity] = useState(Math.max(initialQuantity, 1));
  const [note, setNote] = useState(initialNote ?? "");

  if (!dish) {
    return null;
  }

  const isAvailable = dish.available;
  const subtotal = dish.price * quantity;

  return (
    <div className="fixed inset-0 z-50 mx-auto max-w-[520px] bg-background/70 backdrop-blur-sm">
      <button
        aria-label="Đóng chi tiết món"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onClose}
        type="button"
      />
      <section className="absolute inset-x-0 bottom-0 max-h-[92vh] overflow-hidden rounded-t-lg border border-border bg-card shadow-lg">
        <div className="max-h-[calc(92vh-5rem)] overflow-y-auto">
          <div className="relative aspect-[16/10] bg-muted">
            {dish.imageUrl ? (
              <div
                aria-label={dish.name}
                className="h-full w-full bg-cover bg-center"
                role="img"
                style={{ backgroundImage: `url("${dish.imageUrl}")` }}
              />
            ) : (
              <div className="grid h-full place-items-center text-primary">
                <Utensils className="size-12" />
              </div>
            )}
            <Button
              aria-label="Đóng chi tiết món"
              className="absolute right-3 top-3 bg-background/90 backdrop-blur"
              onClick={onClose}
              size="icon"
              type="button"
              variant="outline"
            >
              <X />
            </Button>
          </div>

          <div className="space-y-4 p-4">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    {categoryName}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-foreground">
                    {dish.name}
                  </h2>
                </div>
                {!isAvailable ? (
                  <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    Hết hàng
                  </span>
                ) : null}
              </div>
              {dish.description ? (
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {dish.description}
                </p>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  Món chưa có mô tả chi tiết.
                </p>
              )}
              <p className="mt-3 text-lg font-semibold text-primary">
                {formatCurrency(dish.price)}
              </p>
            </div>

            <label className="block text-sm font-medium text-foreground">
              Ghi chú cho món này
              <textarea
                className="mt-2 min-h-20 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                onChange={(event) => setNote(event.target.value)}
                placeholder="Ít cay, không hành..."
                value={note}
              />
            </label>

            <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
              <span className="text-sm font-medium text-foreground">
                Số lượng
              </span>
              <div className="flex items-center rounded-full border border-border bg-card">
                <Button
                  disabled={!isAvailable || quantity <= 1}
                  onClick={() => setQuantity((current) => current - 1)}
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                >
                  <Minus />
                </Button>
                <span className="w-9 text-center text-sm font-semibold text-foreground">
                  {quantity}
                </span>
                <Button
                  disabled={!isAvailable}
                  onClick={() => setQuantity((current) => current + 1)}
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                >
                  <Plus />
                </Button>
              </div>
            </div>

            {!isAvailable ? (
              <div className="rounded-lg border border-border bg-muted p-3 text-sm text-muted-foreground">
                Món hiện chưa khả dụng. Vui lòng chọn món khác.
              </div>
            ) : null}
          </div>
        </div>

        <div className="border-t border-border bg-card p-4">
          <Button
            className="h-12 w-full justify-between rounded-lg px-4"
            disabled={!isAvailable}
            onClick={() =>
              onSave(dish.id, quantity, note.trim() || undefined)
            }
            type="button"
          >
            <span>
              {initialQuantity > 0 ? "Cập nhật giỏ" : "Thêm vào giỏ"}
            </span>
            <span>{formatCurrency(subtotal)}</span>
          </Button>
        </div>
      </section>
    </div>
  );
}
