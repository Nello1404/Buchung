import { ladeGalerieVoll } from "@/lib/site-images";
import { GalerieClient } from "@/components/GalerieClient";

// Öffentliche Bildergalerie: feste 4-Kachel-Struktur (Stellplatz, Flotte, Team,
// Aufbereitung). Kategorien ohne gepflegtes Bild zeigen einen „Bild folgt"-
// Platzhalter – die echten Fotos pflegst du bequem über Admin → Bilder.
export async function Galerie() {
  let gruppen: Awaited<ReturnType<typeof ladeGalerieVoll>> = [];
  try {
    gruppen = await ladeGalerieVoll();
  } catch (error) {
    console.error("Galerie konnte nicht geladen werden:", error);
    return null;
  }
  if (gruppen.length === 0) return null;

  return (
    <section id="einblicke" className="mx-auto w-full max-w-6xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center" data-reveal>
        <p className="eyebrow">Einblicke</p>
        <h2 className="mt-4 font-serif text-3xl font-semibold text-ink sm:text-4xl">
          FlySpot Valet in Bildern
        </h2>
        <p className="mt-4 text-muted">
          Ein Blick auf Gelände, Flotte, Team und Aufbereitung – tippen Sie auf eine Kachel für mehr.
        </p>
      </div>

      <div data-reveal>
        <GalerieClient gruppen={gruppen} />
      </div>
    </section>
  );
}
