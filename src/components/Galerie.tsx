import { ladeGalerie } from "@/lib/site-images";

// Öffentliche Bildergalerie auf der Startseite. Rendert nichts, solange keine
// Bilder gepflegt sind – so bleibt die Seite ohne Blob-Konfiguration unverändert.
export async function Galerie() {
  let gruppen: Awaited<ReturnType<typeof ladeGalerie>> = [];
  try {
    gruppen = await ladeGalerie();
  } catch (error) {
    console.error("Galerie konnte nicht geladen werden:", error);
    return null;
  }
  if (gruppen.length === 0) return null;

  return (
    <section id="einblicke" className="mx-auto w-full max-w-6xl px-6 py-24">
      <div className="text-center">
        <p className="eyebrow">Einblicke</p>
        <h2 className="mt-4 font-serif text-3xl font-semibold text-ink sm:text-4xl">
          FlySpot Valet in Bildern
        </h2>
      </div>

      <div className="mt-12 space-y-14">
        {gruppen.map((g) => (
          <div key={g.info.code}>
            <h3 className="font-serif text-xl font-medium text-ink">{g.info.label}</h3>
            <p className="mt-1 text-sm text-muted">{g.info.beschreibung}</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {g.bilder.map((b) => (
                <div key={b.id} className="card overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={b.url}
                    alt={b.alt || g.info.label}
                    loading="lazy"
                    className="h-56 w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
