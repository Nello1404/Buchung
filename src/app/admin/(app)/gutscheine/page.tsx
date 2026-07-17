import { prisma } from "@/lib/prisma";
import { formatDatum } from "@/lib/format";
import { GutscheinErstellen } from "@/components/admin/GutscheinErstellen";

export default async function GutscheinePage() {
  const vouchers = await prisma.voucher.findMany({
    include: { customer: true },
    orderBy: { issuedAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-ink">Gutscheine</h1>
      <p className="mt-1 text-sm text-muted">
        Treue-Gutschein &bdquo;1 Tag gratis&ldquo; – an eine Kunden-E-Mail gebunden, einmalig einlösbar.
      </p>

      <GutscheinErstellen />

      <div className="mt-8 card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-subtle">
                <th className="px-5 py-3 font-medium">Code</th>
                <th className="px-5 py-3 font-medium">Kunde</th>
                <th className="px-5 py-3 font-medium">Erstellt</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-muted">Noch keine Gutscheine.</td></tr>
              )}
              {vouchers.map((v) => (
                <tr key={v.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3 font-mono text-gold">{v.code}</td>
                  <td className="px-5 py-3 text-ink">{v.customer.email}</td>
                  <td className="px-5 py-3 text-muted">{formatDatum.format(v.issuedAt)}</td>
                  <td className="px-5 py-3">
                    {v.redeemedAt ? (
                      <span className="text-muted">Eingelöst am {formatDatum.format(v.redeemedAt)}</span>
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
