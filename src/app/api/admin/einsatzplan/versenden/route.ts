import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { sendeEinsatzplan } from "@/lib/email";

const datumRegex = /^\d{4}-\d{2}-\d{2}$/;

const schema = z.object({
  von: z.string().regex(datumRegex),
  bis: z.string().regex(datumRegex),
});

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

function tagUtc(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

const wochentag = new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "UTC" });
const kurz = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Zeitraum ungültig." }, { status: 400 });
  }
  const { von, bis } = parsed.data;

  const mitarbeiter = await prisma.mitarbeiter.findMany({
    where: { active: true, email: { not: null } },
    include: {
      schichten: {
        where: { datum: { gte: tagUtc(von), lte: tagUtc(bis) } },
        orderBy: [{ datum: "asc" }, { vonZeit: "asc" }],
      },
    },
  });

  const zeitraumLabel = `${kurz.format(tagUtc(von))} – ${kurz.format(tagUtc(bis))}`;

  let gesendet = 0;
  const ohneEmail: string[] = [];
  for (const m of mitarbeiter) {
    if (!m.email) {
      ohneEmail.push(m.name);
      continue;
    }
    try {
      await sendeEinsatzplan({
        an: m.email,
        name: m.name,
        zeitraumLabel,
        schichten: m.schichten.map((s) => ({
          datumLabel: wochentag.format(s.datum),
          vonZeit: s.vonZeit,
          bisZeit: s.bisZeit,
          notiz: s.notiz,
        })),
        feedUrl: `${BASE_URL}/api/kalender/${m.feedToken}`,
      });
      gesendet++;
    } catch (e) {
      console.error(`Einsatzplan-Versand an ${m.email} fehlgeschlagen:`, e);
    }
  }

  // Aktive Mitarbeiter ganz ohne E-Mail-Adresse mitzählen (Hinweis fürs UI).
  const ohneAdresse = await prisma.mitarbeiter.count({ where: { active: true, email: null } });

  return NextResponse.json({ ok: true, gesendet, ohneAdresse });
}
