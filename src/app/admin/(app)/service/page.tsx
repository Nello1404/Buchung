import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ServiceKatalog } from "@/components/admin/ServiceKatalog";
import { PageHeader } from "@/components/admin/PageHeader";

export default async function ServicePage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (session.rolle !== "ADMIN") redirect("/admin/buchungen");

  const [services, vehicleClasses] = await Promise.all([
    prisma.service.findMany({
      orderBy: [{ kategorie: "asc" }, { sortOrder: "asc" }],
      include: { preise: true },
    }),
    prisma.vehicleClass.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        titel="FlySpot Service – Katalog"
        beschreibung="Rundum-Serviceangebot fürs Fahrzeug. Festpreis-Leistungen haben je Fahrzeugklasse einen Preis; „auf Anfrage“ läuft per Angebot. Alles Angelegte erscheint auf /service."
      />

      <ServiceKatalog
        services={services.map((s) => ({
          id: s.id,
          code: s.code,
          name: s.name,
          kategorie: s.kategorie,
          beschreibung: s.beschreibung,
          typ: s.typ,
          inBuchung: s.inBuchung,
          aufServiceSeite: s.aufServiceSeite,
          sortOrder: s.sortOrder,
          active: s.active,
          preise: s.preise.map((p) => ({ vehicleClassId: p.vehicleClassId, preisCent: p.preisCent })),
        }))}
        vehicleClasses={vehicleClasses.map((vc) => ({ id: vc.id, code: vc.code, name: vc.name }))}
      />
    </div>
  );
}
