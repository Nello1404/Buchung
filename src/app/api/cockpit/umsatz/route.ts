import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { aufloesenZeitraum, berechneUmsatz, type Preset } from "@/lib/revenue";

const presets: Preset[] = ["tag", "woche", "monat", "jahr", "custom"];

export async function GET(request: Request) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const sp = new URL(request.url).searchParams;
  const presetParam = sp.get("preset") ?? "monat";
  const preset = (presets.includes(presetParam as Preset) ? presetParam : "monat") as Preset;

  const { von, bis, granularitaet } = aufloesenZeitraum(preset, sp.get("von") ?? undefined, sp.get("bis") ?? undefined);
  const ergebnis = await berechneUmsatz(von, bis, granularitaet);
  return NextResponse.json(ergebnis);
}
