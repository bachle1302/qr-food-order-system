export type AdminCategory = {
  id: string;
  name: string;
  description?: string | null;
};

export type CategoryPayload = {
  name: string;
  description?: string;
};
