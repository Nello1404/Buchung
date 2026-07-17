import { prisma } from "@/lib/prisma";
import { TarifEditor } from "@/components/admin/TarifEditor";

export default async function TarifePage() {
  const [products, vehicleClasses, tariffRules, addons] = await Promise.all([
    prisma.product.findMany({ orderBy: { code: "asc" } }),
    prisma.vehicleClass.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.tariffRule.findMany({ orderBy: [{ productId: "asc" }, { vehicleClassId: "asc" }, { minTage: "asc" }] }),
    prisma.serviceAddon.findMany({ where: { active: true }, orderBy: { name: "asc" }, include: { preise: true } }),
  ]);

  const daten = {
    products: products.map((p) => ({ id: p.id, code: p.code, name: p.name })),
    vehicleClasses: vehicleClasses.map((v) => ({ id: v.id, code: v.code, name: v.name })),
    tariffRules: tariffRules.map((t) => ({
      id: t.id,
      productId: t.productId,
      vehicleClassId: t.vehicleClassId,
      minTage: t.minTage,
      maxTage: t.maxTage,
      preisProTagCent: t.preisProTagCent,
    })),
    addons: addons.map((a) => ({
      id: a.id,
      name: a.name,
      preise: a.preise.map((p) => ({ id: p.id, vehicleClassId: p.vehicleClassId, preisCent: p.preisCent })),
    })),
  };

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-ink">Preise &amp; Tarife</h1>
      <p className="mt-1 text-sm text-muted">
        Preise pro Tag je Produkt, Fahrzeugklasse und Parkdauer. Änderungen gelten sofort für neue Buchungen.
      </p>
      <TarifEditor daten={daten} />
    </div>
  );
}
