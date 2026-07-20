import { z } from "zod";

const datumRegex = /^\d{4}-\d{2}-\d{2}$/;
const zeitRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const quoteSchema = z.object({
  productCode: z.enum(["VALET", "SHUTTLE"]),
  vehicleClassCode: z.string().trim().min(1, "Bitte eine Fahrzeugklasse wählen."),
  anreiseDatum: z.string().regex(datumRegex, "Bitte ein gültiges Anreisedatum wählen."),
  anreiseZeit: z.string().regex(zeitRegex, "Bitte eine gültige Anreisezeit wählen."),
  abreiseDatum: z.string().regex(datumRegex, "Bitte ein gültiges Abreisedatum wählen."),
  abreiseZeit: z.string().regex(zeitRegex, "Bitte eine gültige Abreisezeit wählen."),
  addonCodes: z.array(z.string()).default([]),
  /** Zusätzlich gewählte Festpreis-Leistungen aus dem FlySpot-Service-Katalog. */
  serviceCodes: z.array(z.string()).default([]),
  voucherCode: z.string().trim().min(1).optional(),
  /** Nur nötig, wenn voucherCode gesetzt ist – der Gutschein ist an eine E-Mail gebunden. */
  customerEmail: z.string().trim().email().optional(),
});

export const createBookingSchema = quoteSchema
  .extend({
    flugnummer: z.string().trim().min(1).optional(),
    rueckflugnummer: z.string().trim().min(1).optional(),
    kunde: z.object({
      name: z.string().trim().min(2, "Bitte Vor- und Nachnamen angeben."),
      email: z.string().trim().email("Bitte eine gültige E-Mail-Adresse angeben."),
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
    if (data.productCode === "VALET" && !data.rueckflugnummer) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Die Flugnummer des Rückflugs ist bei Valet-Buchungen Pflicht.",
        path: ["rueckflugnummer"],
      });
    }
  });

export type QuoteInput = z.infer<typeof quoteSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
