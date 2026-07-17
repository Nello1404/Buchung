import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getPlanIst } from "@/lib/plan";
import { prisma } from "@/lib/prisma";
import { PlanDashboard } from "@/components/cockpit/PlanDashboard";

export const metadata = { title: "Plan-Ist – FlySpot Valet" };

export default async function PlanPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const jetzt = new Date();
  const jahr = jetzt.getUTCFullYear();
  const monat = jetzt.getUTCMonth() + 1;

  const [planIst, kategorien, settings] = await Promise.all([
    getPlanIst(jahr, monat),
    prisma.expenseCategory.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.settings.findUnique({ where: { id: "default" } }),
  ]);

  return (
    <PlanDashboard
      initial={planIst}
      kategorien={kategorien.map((k) => ({ id: k.id, name: k.name, budgetCent: k.monatsBudgetCent }))}
      schwellen={{
        warnAuslastungProzent: settings?.warnAuslastungProzent ?? 40,
        warnTagVollProzent: settings?.warnTagVollProzent ?? 90,
        warnStornoquoteProzent: settings?.warnStornoquoteProzent ?? 20,
      }}
    />
  );
}
