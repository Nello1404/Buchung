import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { aufloesenZeitraum, berechneUmsatz } from "@/lib/revenue";
import { UmsatzDashboard } from "@/components/cockpit/UmsatzDashboard";

export const metadata = { title: "Umsatz – FlySpot Valet" };

export default async function UmsatzPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const { von, bis, granularitaet } = aufloesenZeitraum("monat");
  const initial = await berechneUmsatz(von, bis, granularitaet);
  return <UmsatzDashboard initial={initial} />;
}
