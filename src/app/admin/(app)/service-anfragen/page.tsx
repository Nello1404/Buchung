import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ServiceAnfragenListe } from "@/components/admin/ServiceAnfragenListe";

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
      <h1 className="font-serif text-2xl font-semibold text-ink">Service-Anfragen</h1>
      <p className="mt-1 text-sm text-muted">
        Kundenanfragen zu FlySpot Service.{" "}
        {offen > 0 ? (
          <span className="text-gold">{offen} neue Anfrage{offen === 1 ? "" : "n"}.</span>
        ) : (
          "Aktuell keine neuen Anfragen."
        )}
      </p>

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
