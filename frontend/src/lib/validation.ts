import { z } from "zod";

export const checkoutSchema = z.object({
  customerName: z.string().min(2),
  email: z.string().email(),
  address: z.string().min(5),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

