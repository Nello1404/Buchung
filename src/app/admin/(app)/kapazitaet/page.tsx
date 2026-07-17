import { prisma } from "@/lib/prisma";
import { formatDatum } from "@/lib/format";
import { berlinKalendertag } from "@/lib/date";
import { KapazitaetForm } from "@/components/admin/KapazitaetForm";

export default async function KapazitaetPage() {
  const heute = berlinKalendertag(new Date());
  const in14 = new Date(heute);
  in14.setUTCDate(in14.getUTCDate() + 14);

  const [products, tage] = await Promise.all([
    prisma.product.findMany({ orderBy: { code: "asc" } }),
    prisma.capacityDay.findMany({
      where: { date: { gte: heute, lt: in14 } },
      include: { product: true },
      orderBy: { date: "asc" },
    }),
  ]);

  // Gruppieren nach Datum
  const proTag = new Map<string, { date: Date; werte: Record<string, { kontingent: number; belegt: number }> }>();
  for (const t of tage) {
    const key = t.date.toISOString().slice(0, 10);
    if (!proTag.has(key)) proTag.set(key, { date: t.date, werte: {} });
    proTag.get(key)!.werte[t.product.code] = { kontingent: t.kontingent, belegt: t.belegt };
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-ink">Kapazität</h1>
      <p className="mt-1 text-sm text-muted">
        Verfügbare Plätze je Produkt und Tag. Belegung wird automatisch mitgezählt.
      </p>

      <KapazitaetForm />

      <div className="mt-8 card overflow-hidden">
        <div className="border-b border-line px-5 py-4">
          <h2 className="font-medium text-ink">Nächste 14 Tage</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-subtle">
                <th className="px-5 py-3 font-medium">Datum</th>
                {products.map((p) => (
                  <th key={p.id} className="px-5 py-3 font-medium">{p.code === "VALET" ? "Valet" : "Shuttle"} (frei / gesamt)</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...proTag.values()].map((row) => (
                <tr key={row.date.toISOString()} className="border-b border-line last:border-0">
                  <td className="px-5 py-3 text-ink">{formatDatum.format(row.date)}</td>
                  {products.map((p) => {
                    const w = row.werte[p.code];
                    if (!w) return <td key={p.id} className="px-5 py-3 text-subtle">–</td>;
                    const frei = w.kontingent - w.belegt;
                    return (
                      <td key={p.id} className="px-5 py-3">
                        <span className={frei <= 0 ? "text-[var(--danger)]" : "text-ink"}>{frei}</span>
                        <span className="text-subtle"> / {w.kontingent}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
