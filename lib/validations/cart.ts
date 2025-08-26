import { z } from "zod";

export const addCartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).optional().default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1),
});
