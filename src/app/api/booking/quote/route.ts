import { NextResponse } from "next/server";
import { quoteSchema } from "@/lib/booking-schema";
import { berechneAngebot, ProduktNichtGefundenError } from "@/lib/booking";
import { KeinTarifError, SperrtagError } from "@/lib/pricing";

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = quoteSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const angebot = await berechneAngebot(parsed.data);
    return NextResponse.json({
      tage: angebot.tage.length,
      preisTageCent: angebot.preis.preisTageCent,
      preisAddonsCent: angebot.preis.preisAddonsCent,
      gutscheinRabattCent: angebot.preis.gutscheinRabattCent,
      preisGesamtCent: angebot.preis.preisGesamtCent,
      addonBreakdown: angebot.preis.addonBreakdown,
      verfuegbar: angebot.verfuegbar,
      ausgebuchteTage: angebot.ausgebuchteTage.map((d) => d.toISOString().slice(0, 10)),
      gutschein: angebot.voucher,
    });
  } catch (error) {
    if (error instanceof SperrtagError) {
      return NextResponse.json({ error: error.message, code: "SPERRTAG" }, { status: 409 });
    }
    if (error instanceof KeinTarifError) {
      return NextResponse.json({ error: error.message, code: "KEIN_TARIF" }, { status: 422 });
    }
    if (error instanceof ProduktNichtGefundenError || error instanceof RangeError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Preis konnte nicht berechnet werden." }, { status: 500 });
  }
}
