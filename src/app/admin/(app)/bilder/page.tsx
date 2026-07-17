import { BilderVerwaltung } from "@/components/admin/BilderVerwaltung";

export const metadata = { title: "Bilder – FlySpot Valet" };

export default function BilderPage() {
  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-ink">Bilder</h1>
      <p className="mt-1 text-sm text-muted">
        Fotos für die Webseite verwalten – Stellplatz, Flotte, Team und Aufbereitung. Verborgene
        Bilder erscheinen nicht öffentlich.
      </p>
      <BilderVerwaltung />
    </div>
  );
}
