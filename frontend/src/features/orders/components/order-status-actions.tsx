import { Button } from "@/components/ui/button";
import type { OrderStatus } from "../types";
import { ORDER_STATUS_LABELS } from "../lib/order-ui";

type OrderStatusActionsProps = {
  actions: OrderStatus[];
  disabled?: boolean;
  onSelect: (status: OrderStatus) => void;
};

export function OrderStatusActions({
  actions,
  disabled,
  onSelect,
}: OrderStatusActionsProps) {
  if (actions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Đơn đã ở trạng thái kết thúc.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((status) => (
        <Button
          disabled={disabled}
          key={status}
          onClick={() => onSelect(status)}
          size="sm"
          variant={status === "CANCELLED" ? "destructive" : "outline"}
        >
          {ORDER_STATUS_LABELS[status]}
        </Button>
      ))}
    </div>
  );
}
