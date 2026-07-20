import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { FahrerVerwaltung } from "@/components/admin/FahrerVerwaltung";

export default async function FahrerPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (session.rolle !== "ADMIN") redirect("/admin/buchungen");

  const fahrer = await prisma.fahrer.findMany({
    orderBy: [{ active: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-ink">Fahrer</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Pflegen Sie hier die Liste Ihrer Fahrer. Diese Namen stehen im Übergabeprotokoll als
        Pflicht-Auswahl zur Verfügung, damit immer klar ist, wer die Übergabe durchgeführt hat.
      </p>

      <FahrerVerwaltung
        fahrer={fahrer.map((f) => ({ id: f.id, name: f.name, active: f.active, sortOrder: f.sortOrder }))}
      />
    </div>
  );
}
