import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { getMonatsuebersicht } from "@/lib/finance";

function eur(cent: number): string {
  return (cent / 100).toFixed(2).replace(".", ",");
}

export async function GET(request: Request) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const sp = new URL(request.url).searchParams;
  const jetzt = new Date();
  const jahr = Number(sp.get("jahr")) || jetzt.getUTCFullYear();
  const monat = Number(sp.get("monat")) || jetzt.getUTCMonth() + 1;

  const [u, ausgaben] = await Promise.all([
    getMonatsuebersicht(jahr, monat),
    prisma.expense.findMany({
      where: { datum: { gte: new Date(Date.UTC(jahr, monat - 1, 1)), lt: new Date(Date.UTC(jahr, monat, 1)) } },
      include: { category: true },
      orderBy: { datum: "asc" },
    }),
  ]);

  const zeilen: string[] = [];
  zeilen.push(`FlySpot Valet – Betriebsübersicht ${jahr}-${String(monat).padStart(2, "0")}`);
  zeilen.push("Hinweis;Ersetzt nicht die Buchhaltung des Steuerberaters");
  zeilen.push("");
  zeilen.push("Position;EUR");
  zeilen.push(`Einnahmen (brutto);${eur(u.einnahmenBruttoCent)}`);
  zeilen.push(`Erstattungen;${eur(u.erstattetCent)}`);
  zeilen.push(`Einnahmen (nach Storno);${eur(u.einnahmenCent)}`);
  zeilen.push(`Ausgaben;${eur(u.ausgabenCent)}`);
  zeilen.push(`Ergebnis;${eur(u.ergebnisCent)}`);
  zeilen.push(`Steuer-Rücklage (${u.ruecklageProzent}%);${eur(u.ruecklageCent)}`);
  zeilen.push("");
  zeilen.push("Datum;Kategorie;Betrag (EUR);Notiz");
  for (const a of ausgaben) {
    const notiz = (a.notiz ?? "").replace(/;/g, ",");
    zeilen.push(`${a.datum.toISOString().slice(0, 10)};${a.category.name};${eur(a.betragCent)};${notiz}`);
  }

  const csv = "﻿" + zeilen.join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="betriebsuebersicht-${jahr}-${String(monat).padStart(2, "0")}.csv"`,
    },
  });
}
