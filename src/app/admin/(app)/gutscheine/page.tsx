import { prisma } from "@/lib/prisma";
import { formatDatum, centZuEUR } from "@/lib/format";
import { GutscheinErstellen } from "@/components/admin/GutscheinErstellen";

const typLabel: Record<string, string> = {
  TAG_GRATIS: "1 Tag gratis",
  PROZENT: "Prozent-Rabatt",
  BETRAG: "Euro-Rabatt",
};

function wertText(typ: string, wert: number): string {
  if (typ === "PROZENT") return `${wert} %`;
  if (typ === "BETRAG") return centZuEUR(wert);
  return "1 Tag";
}

export default async function GutscheinePage() {
  const vouchers = await prisma.voucher.findMany({
    include: { customer: true },
    orderBy: { issuedAt: "desc" },
    take: 300,
  });

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-ink">Gutscheine &amp; Rabattaktionen</h1>
      <p className="mt-1 text-sm text-muted">
        Erstellen Sie einzelne oder viele Codes: 1 Tag gratis, Prozent- oder Euro-Rabatt. Jeder Code ist einmalig einlösbar.
      </p>

      <GutscheinErstellen />

      <div className="mt-8 card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-subtle">
                <th className="px-5 py-3 font-medium">Code</th>
                <th className="px-5 py-3 font-medium">Typ</th>
                <th className="px-5 py-3 font-medium">Wert</th>
                <th className="px-5 py-3 font-medium">Aktion / Kunde</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-muted">Noch keine Gutscheine.</td></tr>
              )}
              {vouchers.map((v) => (
                <tr key={v.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3 font-mono text-gold">{v.code}</td>
                  <td className="px-5 py-3 text-muted">{typLabel[v.typ] ?? v.typ}</td>
                  <td className="px-5 py-3 text-ink">{wertText(v.typ, v.wert)}</td>
                  <td className="px-5 py-3 text-muted">{v.bezeichnung || v.customer?.email || "Aktion (offen)"}</td>
                  <td className="px-5 py-3">
                    {v.redeemedAt ? (
                      <span className="text-muted">Eingelöst {formatDatum.format(v.redeemedAt)}</span>
                    ) : (
                      <span className="text-[var(--success)]">Offen</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
