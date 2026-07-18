import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { ladeBildHoch, blobKonfiguriert, BlobNichtKonfiguriertError } from "@/lib/blob";
import { istKategorie } from "@/lib/image-categories";

const ERLAUBTE_TYPEN = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export async function GET() {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const bilder = await prisma.siteImage.findMany({
    orderBy: [{ kategorie: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ bilder, blobKonfiguriert: blobKonfiguriert() });
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  if (!blobKonfiguriert()) {
    return NextResponse.json({ error: new BlobNichtKonfiguriertError().message }, { status: 503 });
  }

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });

  const kategorie = String(form.get("kategorie") ?? "");
  const alt = String(form.get("alt") ?? "").slice(0, 200);
  const datei = form.get("datei");

  if (!istKategorie(kategorie)) {
    return NextResponse.json({ error: "Unbekannte Kategorie." }, { status: 400 });
  }
  if (!(datei instanceof File)) {
    return NextResponse.json({ error: "Keine Datei übermittelt." }, { status: 400 });
  }
  if (!ERLAUBTE_TYPEN.includes(datei.type)) {
    return NextResponse.json({ error: "Nur JPG, PNG, WebP oder AVIF erlaubt." }, { status: 415 });
  }
  if (datei.size > MAX_BYTES) {
    return NextResponse.json({ error: "Datei ist zu groß (max. 8 MB)." }, { status: 413 });
  }

  const buffer = Buffer.from(await datei.arrayBuffer());
  const sichererName = (datei.name || "bild").replace(/[^a-zA-Z0-9._-]/g, "_");

  let hochgeladen;
  try {
    hochgeladen = await ladeBildHoch(`bilder/${kategorie.toLowerCase()}/${sichererName}`, buffer, datei.type);
  } catch (error) {
    if (error instanceof BlobNichtKonfiguriertError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("Bild-Upload fehlgeschlagen:", error);
    return NextResponse.json({ error: "Upload fehlgeschlagen." }, { status: 502 });
  }

  const max = await prisma.siteImage.aggregate({
    where: { kategorie },
    _max: { sortOrder: true },
  });

  const bild = await prisma.siteImage.create({
    data: {
      kategorie,
      url: hochgeladen.url,
      pathname: hochgeladen.pathname,
      alt,
      sortOrder: (max._max.sortOrder ?? 0) + 1,
    },
  });

  return NextResponse.json({ bild });
}
