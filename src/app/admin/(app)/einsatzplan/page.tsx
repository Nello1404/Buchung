import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import { EinsatzplanEditor } from "@/components/admin/EinsatzplanEditor";

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
      <h1 className="font-serif text-2xl font-semibold text-ink">Einsatzplanung</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Planen Sie die Schichten Ihres Teams pro Woche oder Monat. Über „Plan versenden“ erhalten alle
        Mitarbeiter mit hinterlegter E-Mail ihren persönlichen Plan; alternativ abonnieren sie ihren
        Kalender dauerhaft (Google, Apple, Outlook) über „Kalender abonnieren“.
      </p>

      <EinsatzplanEditor basisUrl={basisUrl} />
    </div>
  );
}
