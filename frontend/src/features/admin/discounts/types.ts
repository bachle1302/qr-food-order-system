export type AdminDiscount = {
  id: string;
  code: string;
  description?: string | null;
  discountPercent: number;
  minOrderAmount: number;
  maxDiscountAmount: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  usageCount: number;
  active: boolean;
};

export type DiscountPayload = {
  code: string;
  description?: string;
  discountPercent: number;
  minOrderAmount: number;
  maxDiscountAmount: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  active: boolean;
};
