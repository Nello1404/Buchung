import { prisma } from "@/lib/prisma";
import { formatDatum, centZuEUR } from "@/lib/format";
import { SaisonForm } from "@/components/admin/SaisonForm";
import { SperrtagForm } from "@/components/admin/SperrtagForm";
import { LoeschButton } from "@/components/admin/LoeschButton";

const produktLabel = (code: string) => (code === "VALET" ? "Valet" : code === "SHUTTLE" ? "Shuttle" : code);

export default async function SaisonPage() {
  const [vehicleClasses, seasonRates, blockedDays] = await Promise.all([
    prisma.vehicleClass.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.seasonRate.findMany({
      include: { product: true, vehicleClass: true },
      orderBy: [{ startDate: "asc" }],
    }),
    prisma.blockedDay.findMany({
      include: { product: true },
      orderBy: [{ date: "asc" }],
    }),
  ]);

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-ink">Saison &amp; Sperrtage</h1>
      <p className="mt-1 text-sm text-muted">
        Saison-Festpreise ersetzen für die betroffenen Tage den regulären Staffelpreis. Sperrtage sind für neue
        Buchungen blockiert. Beides gilt sofort für neue Buchungen.
      </p>

      {/* Saisonpreise */}
      <section className="mt-8">
        <h2 className="font-medium text-ink">Saisonpreise</h2>
        <SaisonForm vehicleClasses={vehicleClasses.map((v) => ({ id: v.id, name: v.name }))} />

        <div className="mt-6 card overflow-hidden">
          <div className="border-b border-line px-5 py-4">
            <h3 className="font-medium text-ink">Hinterlegte Saisonzeiträume</h3>
          </div>
          {seasonRates.length === 0 ? (
            <p className="px-5 py-6 text-sm text-subtle">Noch keine Saisonzeiträume hinterlegt.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-subtle">
                    <th className="px-5 py-3 font-medium">Bezeichnung</th>
                    <th className="px-5 py-3 font-medium">Produkt</th>
                    <th className="px-5 py-3 font-medium">Fahrzeugklasse</th>
                    <th className="px-5 py-3 font-medium">Zeitraum</th>
                    <th className="px-5 py-3 font-medium">Preis/Tag</th>
                    <th className="px-5 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {seasonRates.map((s) => (
                    <tr key={s.id} className="border-b border-line last:border-0">
                      <td className="px-5 py-3 text-ink">{s.name}</td>
                      <td className="px-5 py-3 text-muted">{produktLabel(s.product.code)}</td>
                      <td className="px-5 py-3 text-muted">{s.vehicleClass.name}</td>
                      <td className="px-5 py-3 text-muted">
                        {formatDatum.format(s.startDate)} – {formatDatum.format(s.endDate)}
                      </td>
                      <td className="px-5 py-3 text-ink">{centZuEUR(s.preisProTagCent)}</td>
                      <td className="px-5 py-3 text-right">
                        <LoeschButton endpoint="/api/admin/saison" id={s.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Sperrtage */}
      <section className="mt-12">
        <h2 className="font-medium text-ink">Sperrtage</h2>
        <SperrtagForm />

        <div className="mt-6 card overflow-hidden">
          <div className="border-b border-line px-5 py-4">
            <h3 className="font-medium text-ink">Hinterlegte Sperrtage</h3>
          </div>
          {blockedDays.length === 0 ? (
            <p className="px-5 py-6 text-sm text-subtle">Noch keine Sperrtage hinterlegt.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-subtle">
                    <th className="px-5 py-3 font-medium">Datum</th>
                    <th className="px-5 py-3 font-medium">Gilt für</th>
                    <th className="px-5 py-3 font-medium">Grund</th>
                    <th className="px-5 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {blockedDays.map((b) => (
                    <tr key={b.id} className="border-b border-line last:border-0">
                      <td className="px-5 py-3 text-ink">{formatDatum.format(b.date)}</td>
                      <td className="px-5 py-3 text-muted">
                        {b.product ? produktLabel(b.product.code) : "Alle Produkte"}
                      </td>
                      <td className="px-5 py-3 text-muted">{b.reason ?? "–"}</td>
                      <td className="px-5 py-3 text-right">
                        <LoeschButton endpoint="/api/admin/sperrtage" id={b.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
