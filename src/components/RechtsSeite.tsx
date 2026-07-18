import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { RechtsVorlage } from "@/components/RechtsVorlage";
import { CONTENT_SEITEN, type ContentSlug } from "@/lib/content-pages";

export async function RechtsSeite({ slug }: { slug: ContentSlug }) {
  const meta = CONTENT_SEITEN.find((s) => s.slug === slug)!;
  const page = await prisma.contentPage.findUnique({ where: { slug } });

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <h1 className="font-serif text-3xl font-semibold text-ink">{page?.titel || meta.titel}</h1>
        {page && page.inhalt.trim() ? (
          <div className="mt-6 whitespace-pre-line leading-relaxed text-muted">{page.inhalt}</div>
        ) : (
          <RechtsVorlage slug={slug} />
        )}
        <Link href="/" className="mt-10 inline-block text-sm font-medium text-muted transition-colors hover:text-ink">
          ← Zur Startseite
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
