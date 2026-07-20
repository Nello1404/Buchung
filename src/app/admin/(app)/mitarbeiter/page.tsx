import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { MitarbeiterVerwaltung } from "@/components/admin/MitarbeiterVerwaltung";
import { PageHeader } from "@/components/admin/PageHeader";

export default async function MitarbeiterPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (session.rolle !== "ADMIN") redirect("/admin/buchungen");

  const mitarbeiter = await prisma.mitarbeiter.findMany({
    orderBy: [{ active: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <div>
      <PageHeader
        titel="Mitarbeiter"
        beschreibung="Ihr Team. „Ist Fahrer“ = im Übergabeprotokoll wählbar. Alle aktiven Mitarbeiter lassen sich in der Einsatzplanung verplanen; für den Plan-Versand E-Mail hinterlegen."
      />

      <MitarbeiterVerwaltung
        mitarbeiter={mitarbeiter.map((m) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          istFahrer: m.istFahrer,
          rolle: m.rolle,
          active: m.active,
          sortOrder: m.sortOrder,
        }))}
      />
    </div>
  );
}
