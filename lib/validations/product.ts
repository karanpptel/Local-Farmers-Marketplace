// lib/validations/product.ts

import { z } from "zod";

export const productCreateSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  price:   z.string().or(z.number()),
  stock: z.number().int().min(1, "Stock must be at least 1"),
  category: z.enum(["FRUITS", "VEGETABLES", "GRAINS", "DAIRY"]),
  location: z.string().trim().min(2, "Location is required"),
  image: z.string().url("Image must be a valid URL").optional(),

});





export const productUpdateSchema = productCreateSchema.partial();
export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;


