import { z } from "zod";
import { quoteSchema } from "@/lib/booking-schema";

export const ZAHLUNGSARTEN = ["BAR", "EC", "UEBERWEISUNG", "RECHNUNG"] as const;
export type Zahlungsart = (typeof ZAHLUNGSARTEN)[number];

/// Manuelle Buchung durch das Personal (Telefonkunden). Wie die Online-Buchung,
/// aber ohne Stripe: E-Mail ist optional, dafür ist die Zahlungsart Pflicht.
export const manuelleBuchungSchema = quoteSchema
  .extend({
    flugnummer: z.string().trim().min(1).optional(),
    zahlungsart: z.enum(ZAHLUNGSARTEN),
    notiz: z.string().trim().max(500).optional(),
    kunde: z.object({
      name: z.string().trim().min(2, "Bitte Vor- und Nachnamen angeben."),
      email: z.string().trim().email("Bitte eine gültige E-Mail-Adresse angeben.").optional().or(z.literal("")),
      telefon: z.string().trim().optional(),
    }),
    fahrzeug: z.object({
      kennzeichen: z.string().trim().min(2, "Bitte das Kennzeichen angeben."),
      marke: z.string().trim().optional(),
      farbe: z.string().trim().optional(),
      auffaelligkeiten: z.string().trim().optional(),
    }),
  })
  .superRefine((data, ctx) => {
    if (data.productCode === "VALET" && !data.flugnummer) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Die Flugnummer ist bei Valet-Buchungen Pflicht.",
        path: ["flugnummer"],
      });
    }
  });

export type ManuelleBuchungInput = z.infer<typeof manuelleBuchungSchema>;
