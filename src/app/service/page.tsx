import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ServiceAnfrageForm } from "@/components/ServiceAnfrageForm";
import { centZuEUR } from "@/lib/format";

// Statisch mit Revalidierung (wie die Startseite); Katalogänderungen im Admin
// lösen zusätzlich eine sofortige, gezielte Neuberechnung dieser Seite aus.
export const revalidate = 300;

export const metadata = {
  title: "FlySpot Service – Aufbereitung, Reinigung & Smart Repair | FlySpot Valet",
  description:
    "Während Ihr Auto bei uns parkt, kümmern wir uns um mehr: Innen- & Außenreinigung, Politur, Detailing sowie Smart Repair für Kratzer, Dellen und Steinschläge – am Flughafen Frankfurt.",
};

export default async function ServicePage() {
  const [services, klassen] = await Promise.all([
    prisma.service.findMany({
      where: { active: true, aufServiceSeite: true },
      orderBy: [{ kategorie: "asc" }, { sortOrder: "asc" }],
      include: { preise: true },
    }),
    prisma.vehicleClass.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  // Nach Kategorie gruppieren.
  const gruppen = new Map<string, typeof services>();
  for (const s of services) {
    const arr = gruppen.get(s.kategorie) ?? [];
    arr.push(s);
    gruppen.set(s.kategorie, arr);
  }

  const formLeistungen = services.map((s) => ({
    code: s.code,
    name: s.name,
    kategorie: s.kategorie,
    typ: s.typ,
  }));

  function abPreis(preise: { preisCent: number }[]): string | null {
    if (!preise.length) return null;
    const min = Math.min(...preise.map((p) => p.preisCent));
    return centZuEUR(min);
  }

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-line bg-surface">
          <div className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-20">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-gold">FlySpot Service</p>
            <h1 className="mt-3 max-w-2xl font-serif text-3xl font-semibold leading-tight text-ink sm:text-4xl">
              Fahrzeugpflege &amp; Reparatur vom Fachbetrieb – auch ganz ohne Parkbuchung.
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted">
              Bringen Sie Ihr Auto zu uns: Wir reinigen, pflegen und reparieren – von der Innen- &amp;
              Außenwäsche über Politur und Detailing bis zu Smart Repair für Kratzer, Dellen und
              Steinschläge. Sie stellen einfach eine unverbindliche Terminanfrage, wir melden uns
              mit Termin und Angebot.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#anfrage" className="btn-gold">Termin anfragen</a>
              <a href="#leistungen" className="btn-outline">Leistungen ansehen</a>
            </div>
            <p className="mt-5 text-sm text-subtle">
              Sie parken bei uns? Dann wählen Sie Ihre Wunsch-Leistungen bequem{" "}
              <Link href="/buchen" className="text-gold hover:underline">direkt in der Parkbuchung</Link>{" "}
              – sie werden während der Standzeit erledigt.
            </p>
          </div>
        </section>

        {/* Ablauf */}
        <section className="mx-auto w-full max-w-5xl px-6 py-14">
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { n: "1", t: "Anfragen", d: "Sie wählen die gewünschten Leistungen und senden uns eine unverbindliche Terminanfrage." },
              { n: "2", t: "Termin & Angebot", d: "Wir melden uns mit einem passenden Termin und – wo nötig – einem individuellen Angebot." },
              { n: "3", t: "Wir erledigen es", d: "Sie bringen Ihr Auto vorbei und holen es sauber und gepflegt wieder ab." },
            ].map((step) => (
              <div key={step.n} className="card p-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line-gold font-serif text-sm font-bold text-gold">
                  {step.n}
                </span>
                <h3 className="mt-4 font-serif text-lg font-semibold text-ink">{step.t}</h3>
                <p className="mt-1.5 text-sm text-muted">{step.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Leistungen */}
        <section id="leistungen" className="border-t border-line bg-surface">
          <div className="mx-auto w-full max-w-5xl px-6 py-16">
            <h2 className="font-serif text-2xl font-semibold text-ink sm:text-3xl">Unsere Leistungen</h2>
            <p className="mt-2 max-w-2xl text-muted">
              Festpreise gelten je Fahrzeugklasse und dienen als Orientierung – den genauen Preis
              nennen wir Ihnen mit dem Termin. Reparaturen und Detailing kalkulieren wir nach
              Begutachtung; dafür erhalten Sie ein individuelles Angebot.
            </p>

            <div className="mt-10 space-y-12">
              {[...gruppen.entries()].map(([kategorie, list]) => (
                <div key={kategorie}>
                  <h3 className="font-serif text-xl font-semibold text-gold">{kategorie}</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {list.map((s) => {
                      const ab = s.typ === "FESTPREIS" ? abPreis(s.preise) : null;
                      return (
                        <div key={s.code} className="card flex flex-col p-6">
                          <h4 className="font-medium text-ink">{s.name}</h4>
                          {s.beschreibung && <p className="mt-1.5 flex-1 text-sm text-muted">{s.beschreibung}</p>}
                          <div className="mt-4 flex items-end justify-between border-t border-line pt-4">
                            {s.typ === "FESTPREIS" ? (
                              ab ? (
                                <span className="text-sm text-subtle">
                                  ab <span className="font-serif text-lg text-ink">{ab}</span>
                                </span>
                              ) : (
                                <span className="text-sm text-subtle">Preis auf Anfrage</span>
                              )
                            ) : (
                              <span className="text-sm text-subtle">individuelles Angebot</span>
                            )}
                            <a href="#anfrage" className="text-sm font-medium text-gold hover:underline">
                              Termin anfragen →
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              {services.length === 0 && (
                <p className="text-muted">Unser Serviceangebot wird gerade zusammengestellt.</p>
              )}
            </div>

            {klassen.length > 0 && (
              <p className="mt-8 text-xs text-subtle">
                Fahrzeugklassen: {klassen.map((k) => k.name).join(", ")}. Der genaue Festpreis richtet
                sich nach Ihrer Fahrzeugklasse und wird Ihnen mit dem Termin genannt.
              </p>
            )}
          </div>
        </section>

        {/* Anfrage */}
        <section id="anfrage" className="mx-auto w-full max-w-3xl px-6 py-16">
          <h2 className="font-serif text-2xl font-semibold text-ink sm:text-3xl">Jetzt Service anfragen</h2>
          <p className="mt-2 text-muted">
            Wählen Sie die gewünschten Leistungen und hinterlassen Sie Ihre Kontaktdaten – wir melden
            uns mit einem persönlichen Angebot. Kostenlos und unverbindlich.
          </p>
          <div className="mt-8">
            <ServiceAnfrageForm leistungen={formLeistungen} />
          </div>
          <p className="mt-6 text-sm text-muted">
            Lieber gleich einen Parkplatz sichern?{" "}
            <Link href="/buchen" className="font-medium text-gold hover:underline">Zur Buchung →</Link>
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
