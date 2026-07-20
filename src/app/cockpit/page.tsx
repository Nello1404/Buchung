import { redirect } from "next/navigation";

// Die frühere „Betriebszentrale" ist mit der Admin-Übersicht zu einer einzigen
// Startseite zusammengeführt. Alte Links auf /cockpit landen dort.
export default function CockpitPage() {
  redirect("/admin");
}
