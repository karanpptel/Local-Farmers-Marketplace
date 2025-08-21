import { z } from "zod";

export const createPaymentSchema = z.object({
  orderId: z.string().min(1),
});

export const refundSchema = z.object({
  paymentId: z.string().min(1),
  amount: z.number().positive().optional(), // dollars (optional, full refund if omitted)
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type RefundInput = z.infer<typeof refundSchema>;
