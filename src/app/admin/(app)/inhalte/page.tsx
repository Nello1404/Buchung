import { prisma } from "@/lib/prisma";
import { CONTENT_SEITEN } from "@/lib/content-pages";
import { InhalteEditor } from "@/components/admin/InhalteEditor";

export default async function InhaltePage() {
  const pages = await prisma.contentPage.findMany();
  const seiten = CONTENT_SEITEN.map((s) => ({
    slug: s.slug,
    titel: s.titel,
    inhalt: pages.find((p) => p.slug === s.slug)?.inhalt ?? "",
  }));

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-ink">Rechtstexte</h1>
      <p className="mt-1 text-sm text-muted">
        Impressum, Datenschutz und AGB – Inhalte hier einfügen (Text vom Anwalt). Absätze durch Leerzeilen trennen.
      </p>
      <InhalteEditor seiten={seiten} />
    </div>
  );
}
