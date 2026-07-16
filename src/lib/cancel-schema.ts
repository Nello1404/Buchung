import { z } from "zod";

export const cancelBookingSchema = z.object({
  bookingNumber: z.string().trim().min(1),
  email: z.string().trim().email(),
});
