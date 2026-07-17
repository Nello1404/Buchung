import { ManuelleBuchung } from "@/components/admin/ManuelleBuchung";

export const metadata = { title: "Manuelle Buchung – FlySpot Valet" };

export default function ManuellPage() {
  return (
    <div className="max-w-4xl">
      <h1 className="font-serif text-2xl font-semibold text-ink">Manuelle Buchung</h1>
      <p className="mt-1 text-sm text-muted">
        Für Telefonkunden – Buchung ohne Online-Zahlung anlegen. Preis und Verfügbarkeit werden
        automatisch berechnet, die Zahlungsart wird vermerkt.
      </p>
      <ManuelleBuchung />
    </div>
  );
}
