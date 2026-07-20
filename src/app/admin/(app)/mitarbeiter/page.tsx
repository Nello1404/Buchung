import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { MitarbeiterVerwaltung } from "@/components/admin/MitarbeiterVerwaltung";

export default async function MitarbeiterPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (session.rolle !== "ADMIN") redirect("/admin/buchungen");

  const mitarbeiter = await prisma.mitarbeiter.findMany({
    orderBy: [{ active: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-ink">Mitarbeiter</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Pflegen Sie hier Ihr Team. Mitarbeiter mit „Ist Fahrer“ stehen im Übergabeprotokoll als
        Pflicht-Auswahl bereit; alle aktiven Mitarbeiter lassen sich in der Einsatzplanung verplanen.
        Für den Versand des persönlichen Einsatzplans hinterlegen Sie eine E-Mail-Adresse.
      </p>

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
