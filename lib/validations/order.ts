import { z } from "zod";

export const createOrderSchema = z.object({
  products: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().positive().min(1, "Quantity must be at least 1")
    })
  ).min(1, "At least one product is required"),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"])
});
