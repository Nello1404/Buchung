import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getCockpitData } from "@/lib/cockpit";
import { Cockpit } from "@/components/cockpit/Cockpit";

export const metadata = { title: "Betriebszentrale – FlySpot Valet" };

export default async function CockpitPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const initial = await getCockpitData();
  return <Cockpit initial={initial} />;
}
