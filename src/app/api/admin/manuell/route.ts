import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { manuelleBuchungSchema } from "@/lib/manual-booking-schema";
import {
  berechneAngebot,
  FahrzeugklasseNichtGefundenError,
  generiereBuchungsnummer,
  ProduktNichtGefundenError,
} from "@/lib/booking";
import { KapazitaetError, reserviereKapazitaet } from "@/lib/capacity";
import { KeinTarifError, SperrtagError } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { sendeBuchungsbestaetigung } from "@/lib/email";
import { baueRechnungsPdfFuerBuchung } from "@/lib/invoice";

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = manuelleBuchungSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe", details: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;
  const email = input.kunde.email ? input.kunde.email.toLowerCase() : null;

  // Preis + Verfügbarkeit serverseitig berechnen (Snapshot, Überbuchungsschutz).
  let angebot;
  try {
    angebot = await berechneAngebot({ ...input, customerEmail: email ?? undefined });
  } catch (error) {
    if (error instanceof SperrtagError) return NextResponse.json({ error: error.message, code: "SPERRTAG" }, { status: 409 });
    if (error instanceof KeinTarifError) return NextResponse.json({ error: error.message, code: "KEIN_TARIF" }, { status: 422 });
    if (
      error instanceof ProduktNichtGefundenError ||
      error instanceof FahrzeugklasseNichtGefundenError ||
      error instanceof RangeError
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Buchung konnte nicht berechnet werden." }, { status: 500 });
  }

  if (!angebot.verfuegbar) {
    return NextResponse.json(
      {
        error: "Für den gewählten Zeitraum ist kein Kontingent mehr frei.",
        code: "AUSGEBUCHT",
        ausgebuchteTage: angebot.ausgebuchteTage.map((d) => d.toISOString().slice(0, 10)),
      },
      { status: 409 }
    );
  }
  if (input.voucherCode && !angebot.voucher.gueltig) {
    return NextResponse.json(
      { error: angebot.voucher.grund ?? "Gutscheincode ungültig.", code: "GUTSCHEIN_UNGUELTIG" },
      { status: 422 }
    );
  }

  const settings = await prisma.settings.findUnique({ where: { id: "default" } });
  const bezahlt = input.zahlungsart !== "RECHNUNG";
  const jetzt = new Date();

  try {
    const booking = await prisma.$transaction(async (tx) => {
      await reserviereKapazitaet(tx, angebot.product.id, angebot.tage);

      // Kunde: mit E-Mail per upsert (Wiederkehrer), ohne E-Mail immer neu anlegen
      // (Platzhalter-Adresse, damit die Unique-Bedingung erfüllt ist).
      const customer = email
        ? await tx.customer.upsert({
            where: { email },
            update: { name: input.kunde.name, phone: input.kunde.telefon },
            create: { email, name: input.kunde.name, phone: input.kunde.telefon },
          })
        : await tx.customer.create({
            data: {
              email: `manuell-${Date.now()}-${Math.floor(Math.random() * 1e6)}@no-email.flyspot-valet.de`,
              name: input.kunde.name,
              phone: input.kunde.telefon,
            },
          });

      let nummer = generiereBuchungsnummer();
      for (let i = 0; i < 5; i++) {
        if (!(await tx.booking.findUnique({ where: { bookingNumber: nummer } }))) break;
        nummer = generiereBuchungsnummer();
      }

      const neu = await tx.booking.create({
        data: {
          bookingNumber: nummer,
          customerId: customer.id,
          productId: angebot.product.id,
          status: "BEZAHLT", // manuell = bestätigte Reservierung
          anreise: angebot.anreise,
          abreise: angebot.abreise,
          flugnummer: input.flugnummer,
          rueckflugnummer: input.rueckflugnummer,
          notiz: input.notiz,
          preisTageCent: angebot.preis.preisTageCent,
          preisAddonsCent: angebot.preis.preisAddonsCent,
          gutscheinRabattCent: angebot.preis.gutscheinRabattCent,
          preisGesamtCent: angebot.preis.preisGesamtCent,
          preisBreakdown: JSON.parse(JSON.stringify(angebot.preis)),
          stornoFristStunden: settings?.stornoFristStunden ?? 48,
          stornoErstattungFruehProzent: settings?.stornoErstattungFrueh ?? 100,
          stornoErstattungSpaetProzent: settings?.stornoErstattungSpaet ?? 50,
          vehicle: {
            create: {
              kennzeichen: input.fahrzeug.kennzeichen,
              marke: input.fahrzeug.marke,
              farbe: input.fahrzeug.farbe,
              auffaelligkeiten: input.fahrzeug.auffaelligkeiten,
              vehicleClassId: angebot.vehicleClass.id,
              vehicleClassNameSnapshot: angebot.vehicleClass.name,
            },
          },
          addons: angebot.addonRows.length
            ? {
                create: angebot.addonRows.map((a) => ({
                  serviceAddonId: a.serviceAddonId,
                  serviceId: a.serviceId,
                  preisCentSnapshot: a.preisCent,
                  nameSnapshot: a.name,
                })),
              }
            : undefined,
          payment: {
            create: {
              betragCent: angebot.preis.preisGesamtCent,
              zahlungsart: input.zahlungsart,
              status: bezahlt ? "BEZAHLT" : "OFFEN",
              bezahltAm: bezahlt ? jetzt : null,
            },
          },
        },
      });

      if (angebot.voucher.gueltig && angebot.voucher.voucherId) {
        await tx.voucher.update({
          where: { id: angebot.voucher.voucherId },
          data: { redeemedBookingId: neu.id, redeemedAt: jetzt },
        });
      }

      return neu;
    });

    // Bestätigung nur, wenn eine echte E-Mail vorliegt.
    if (email) {
      let rechnungPdf: Buffer | null = null;
      try {
        rechnungPdf = await baueRechnungsPdfFuerBuchung(booking.id);
      } catch (e) {
        console.error("Rechnung-PDF für Bestätigungsmail fehlgeschlagen:", e);
      }
      await sendeBuchungsbestaetigung({
        an: email,
        bookingNumber: booking.bookingNumber,
        produktName: angebot.product.name,
        anreise: booking.anreise,
        abreise: booking.abreise,
        preisGesamtCent: booking.preisGesamtCent,
        flugnummer: booking.rueckflugnummer,
        rechnungPdf,
      });
    }

    return NextResponse.json({
      ok: true,
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      bezahlt,
      emailGesendet: Boolean(email),
    });
  } catch (error) {
    if (error instanceof KapazitaetError) {
      return NextResponse.json(
        { error: "Für den gewählten Zeitraum ist kein Kontingent mehr frei.", code: "AUSGEBUCHT" },
        { status: 409 }
      );
    }
    console.error("Manuelle Buchung fehlgeschlagen:", error);
    return NextResponse.json({ error: "Buchung konnte nicht angelegt werden." }, { status: 500 });
  }
}
