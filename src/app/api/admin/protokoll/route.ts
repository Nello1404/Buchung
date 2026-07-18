import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { ladeBildHoch, blobKonfiguriert } from "@/lib/blob";
import { istPhase, phaseLabel } from "@/lib/handover";
import { erzeugeProtokollPdf } from "@/lib/handover-pdf";
import { sendeUebergabeprotokoll } from "@/lib/email";

const ERLAUBTE_TYPEN = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });

  const bookingId = String(form.get("bookingId") ?? "");
  const phase = String(form.get("phase") ?? "");
  const fahrer = String(form.get("fahrer") ?? "").trim();
  const kmRoh = String(form.get("kmStand") ?? "").trim();
  const tankstand = String(form.get("tankstand") ?? "").trim() || null;
  const bemerkung = String(form.get("bemerkung") ?? "").trim() || null;
  const signatur = String(form.get("unterschrift") ?? ""); // data:image/png;base64,…

  if (!istPhase(phase)) return NextResponse.json({ error: "Unbekannte Phase." }, { status: 400 });
  if (fahrer.length < 2) return NextResponse.json({ error: "Bitte den Fahrer angeben." }, { status: 400 });

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return NextResponse.json({ error: "Buchung nicht gefunden." }, { status: 404 });

  const kmStand = kmRoh ? Number.parseInt(kmRoh, 10) : null;
  if (kmRoh && (Number.isNaN(kmStand!) || kmStand! < 0)) {
    return NextResponse.json({ error: "Ungültiger Kilometerstand." }, { status: 400 });
  }

  const fotoDateien = form.getAll("fotos").filter((f): f is File => f instanceof File && f.size > 0);
  const blobOk = blobKonfiguriert();

  // Fotos hochladen (nur wenn Blob konfiguriert – sonst Protokoll ohne Fotos).
  const hochgeladeneFotos: { url: string; pathname: string }[] = [];
  if (blobOk) {
    for (const datei of fotoDateien) {
      if (!ERLAUBTE_TYPEN.includes(datei.type) || datei.size > MAX_BYTES) continue;
      const name = (datei.name || "foto").replace(/[^a-zA-Z0-9._-]/g, "_");
      const buffer = Buffer.from(await datei.arrayBuffer());
      const res = await ladeBildHoch(`protokolle/${bookingId}/${phase.toLowerCase()}/${name}`, buffer, datei.type);
      hochgeladeneFotos.push(res);
    }
  }

  // Unterschrift (data-URL) hochladen.
  let unterschriftUrl: string | null = null;
  let unterschriftPfad: string | null = null;
  if (blobOk && signatur.startsWith("data:image/")) {
    const base64 = signatur.split(",")[1] ?? "";
    if (base64) {
      const buffer = Buffer.from(base64, "base64");
      if (buffer.length > 0 && buffer.length <= MAX_BYTES) {
        const res = await ladeBildHoch(`protokolle/${bookingId}/${phase.toLowerCase()}/unterschrift.png`, buffer, "image/png");
        unterschriftUrl = res.url;
        unterschriftPfad = res.pathname;
      }
    }
  }

  const protokoll = await prisma.handoverProtocol.create({
    data: {
      bookingId,
      phase,
      fahrer,
      kmStand,
      tankstand,
      bemerkung,
      unterschriftUrl,
      unterschriftPfad,
      erstelltVon: guard.session.email,
      fotos: hochgeladeneFotos.length
        ? { create: hochgeladeneFotos.map((f) => ({ url: f.url, pathname: f.pathname })) }
        : undefined,
    },
    include: { fotos: true },
  });

  // PDF erzeugen und per E-Mail ans Team schicken – nicht blockierend: ein Fehler
  // hier darf das bereits gespeicherte Protokoll nicht scheitern lassen.
  try {
    const voll = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { customer: true, product: true, vehicle: true },
    });
    if (voll) {
      const pdfBytes = await erzeugeProtokollPdf({
        bookingNumber: voll.bookingNumber,
        phase: protokoll.phase,
        erstelltAm: protokoll.createdAt,
        erstelltVon: protokoll.erstelltVon,
        fahrer: protokoll.fahrer,
        kmStand: protokoll.kmStand,
        tankstand: protokoll.tankstand,
        bemerkung: protokoll.bemerkung,
        kunde: { name: voll.customer.name, email: voll.customer.email, telefon: voll.customer.phone },
        fahrzeug: {
          kennzeichen: voll.vehicle?.kennzeichen ?? "–",
          klasse: voll.vehicle?.vehicleClassNameSnapshot ?? null,
          marke: voll.vehicle?.marke ?? null,
          farbe: voll.vehicle?.farbe ?? null,
          auffaelligkeiten: voll.vehicle?.auffaelligkeiten ?? null,
        },
        produktName: voll.product.name,
        anreise: voll.anreise,
        abreise: voll.abreise,
        flugnummer: voll.flugnummer,
        fotoUrls: protokoll.fotos.map((f) => f.url),
        unterschriftUrl: protokoll.unterschriftUrl,
      });

      const an = process.env.PROTOKOLL_EMAIL || process.env.REPORT_EMAIL || "service@flyspot-valet.de";
      await sendeUebergabeprotokoll({
        an,
        bookingNumber: voll.bookingNumber,
        phaseLabel: phaseLabel(protokoll.phase),
        kennzeichen: voll.vehicle?.kennzeichen ?? "–",
        kundeName: voll.customer.name,
        fahrer: protokoll.fahrer,
        kmStand: protokoll.kmStand,
        tankstand: protokoll.tankstand,
        erstelltAm: protokoll.createdAt,
        pdf: Buffer.from(pdfBytes),
      });
    }
  } catch (error) {
    console.error("Protokoll-PDF/E-Mail fehlgeschlagen (Protokoll wurde trotzdem gespeichert):", error);
  }

  return NextResponse.json({ protokoll, blobKonfiguriert: blobOk });
}
