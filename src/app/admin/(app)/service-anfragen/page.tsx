import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ServiceAnfragenListe } from "@/components/admin/ServiceAnfragenListe";
import { PageHeader } from "@/components/admin/PageHeader";

export default async function ServiceAnfragenPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (session.rolle !== "ADMIN") redirect("/admin/buchungen");

  const anfragen = await prisma.serviceAnfrage.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  const offen = anfragen.filter((a) => a.status === "NEU").length;

  return (
    <div>
      <PageHeader
        titel="Service-Anfragen"
        beschreibung={offen > 0 ? `${offen} neue Anfrage${offen === 1 ? "" : "n"} · Kundenanfragen zu FlySpot Service.` : "Kundenanfragen zu FlySpot Service. Aktuell keine neuen Anfragen."}
      />

      <ServiceAnfragenListe
        anfragen={anfragen.map((a) => ({
          id: a.id,
          name: a.name,
          email: a.email,
          telefon: a.telefon,
          kennzeichen: a.kennzeichen,
          fahrzeug: a.fahrzeug,
          wunschtermin: a.wunschtermin,
          leistungen: a.leistungen,
          nachricht: a.nachricht,
          status: a.status,
          createdAt: a.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
