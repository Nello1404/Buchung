import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import { EinsatzplanEditor } from "@/components/admin/EinsatzplanEditor";
import { PageHeader } from "@/components/admin/PageHeader";

export const metadata = { title: "Einsatzplanung – FlySpot Valet" };

export default async function EinsatzplanPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (session.rolle !== "ADMIN") redirect("/admin/buchungen");

  // Basis-URL für die Kalender-Abo-Links.
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const basisUrl = process.env.NEXT_PUBLIC_BASE_URL || `${proto}://${host}`;

  return (
    <div>
      <PageHeader
        titel="Einsatzplanung"
        beschreibung="Schichten pro Woche oder Monat planen. „Plan versenden“ schickt jedem Mitarbeiter mit E-Mail seinen Plan; alternativ Kalender abonnieren (Google, Apple, Outlook)."
      />

      <EinsatzplanEditor basisUrl={basisUrl} />
    </div>
  );
}
