import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Galerie } from "@/components/Galerie";
import { Bewertungen } from "@/components/Bewertungen";
import { BrandLogo } from "@/components/BrandLogo";
import { ScrollReveal } from "@/components/ScrollReveal";
import { centZuEUR } from "@/lib/format";
import { abPreiseProProdukt, heroBild } from "@/lib/home-data";

// Startseite alle 5 Minuten neu generieren (Galerie-Bilder aus der DB), damit die
// Seite statisch/schnell bleibt und die Datenbank nicht bei jedem Aufruf trifft.
export const revalidate = 300;

export default async function Home() {
  const [abPreise, heroUrl] = await Promise.all([abPreiseProProdukt(), heroBild()]);
  const abText = (cent?: number) => (cent != null ? `ab ${centZuEUR(cent)}/Tag` : null);

  return (
    <div className="flex flex-1 flex-col">
      <ScrollReveal />
      <SiteHeader transparent />

      {/* Hero */}
      <section className="hero-bg relative overflow-hidden">
        {/* Optionales Hero-Bild mit dunkler Überblendung (sobald ein Bild gepflegt ist) */}
        {heroUrl && (
          <div className="pointer-events-none absolute inset-0">
            <Image src={heroUrl} alt="" fill priority className="object-cover opacity-30" sizes="100vw" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0d0f13] via-[#0d0f13cc] to-transparent" />
          </div>
        )}
        {/* Echtes Logo groß als Erkennungsmerkmal (ab großen Bildschirmen, nur ohne Hero-Bild) */}
        {!heroUrl && (
          <div className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 lg:block xl:right-10">
            <BrandLogo href={null} imgClassName="h-[24rem] w-auto opacity-90 xl:h-[28rem]" />
          </div>
        )}
        <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-36 sm:pt-44">
          <div className="max-w-2xl">
            <p className="eyebrow hero-rise hero-rise-1">Flughafen Frankfurt · Valet &amp; Shuttle</p>
            <h1 className="mt-5 font-serif text-4xl font-semibold leading-[1.1] text-ink sm:text-6xl">
              <span className="hero-rise hero-rise-2 block">Ihr Auto in besten Händen,</span>
              <span className="hero-rise hero-rise-3 block text-gold-gradient">Sie schon in Gedanken im Urlaub.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted hero-rise hero-rise-4">
              Übergeben Sie Ihr Fahrzeug direkt am Terminal – wir parken es sicher und stellen es
              bei Ihrer Rückkehr pünktlich bereit. Kein Suchen, kein Stress, kein Zeitverlust.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4 hero-rise hero-rise-5">
              <Link href="/buchen" className="btn-gold">
                Parkplatz buchen
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 10h12M11 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link href="/#ablauf" className="btn-outline">So funktioniert&apos;s</Link>
            </div>

            {/* Vertrauens-Signale */}
            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-4 hero-rise hero-rise-5">
              {[
                { icon: shieldIcon, text: "Vollständig versichert" },
                { icon: terminalIcon, text: "Direkt am Terminal" },
                { icon: clockIcon, text: "Pünktlich zur Rückkehr" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2.5 text-sm text-muted">
                  <span className="text-gold">{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Vertrauens-Leiste – echte, überprüfbare Zusagen (keine erfundenen Zahlen) */}
      <section className="border-y border-line bg-surface/40">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px overflow-hidden md:grid-cols-4">
          {[
            { icon: terminalIcon, titel: "Direkt am Terminal", text: "Übergabe ohne Umweg" },
            { icon: shieldIcon, titel: "Vollständig versichert", text: "Gesichertes Gelände" },
            { icon: clockIcon, titel: "Pünktlich zur Landung", text: "Wir tracken Ihren Flug" },
            { icon: lockIcon, titel: "Sichere Zahlung", text: "SSL · Stripe · Karte" },
          ].map((v) => (
            <div key={v.titel} className="flex items-center gap-3 px-6 py-6">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line-gold text-gold">
                {v.icon}
              </span>
              <div>
                <div className="text-sm font-medium text-ink">{v.titel}</div>
                <div className="text-xs text-subtle">{v.text}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* So funktioniert's */}
      <section id="ablauf" className="mx-auto w-full max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center" data-reveal>
          <p className="eyebrow">In drei Schritten</p>
          <h2 className="mt-4 font-serif text-3xl font-semibold text-ink sm:text-4xl">
            So einfach parken Sie bei uns
          </h2>
        </div>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {[
            {
              nr: "01",
              titel: "Online buchen",
              text: "Zeitraum und Produkt wählen, Preis sofort sehen und bequem bezahlen – in wenigen Minuten.",
            },
            {
              nr: "02",
              titel: "Am Terminal übergeben",
              text: "Sie kommen zur vereinbarten Zeit ans Terminal. Unser Team übernimmt Ihr Fahrzeug direkt vor Ort.",
            },
            {
              nr: "03",
              titel: "Entspannt zurückkehren",
              text: "Bei Ihrer Ankunft steht das Auto bereit – gewaschen und getankt, wenn Sie möchten.",
            },
          ].map((step, i) => (
            <div key={step.nr} className="card lift p-8" data-reveal data-delay={String(i + 1)}>
              <div className="font-serif text-4xl font-semibold text-gold-gradient">{step.nr}</div>
              <h3 className="mt-4 text-lg font-medium text-ink">{step.titel}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6"><hr className="hr-gold" /></div>

      {/* Produktvergleich */}
      <section id="preise" className="mx-auto w-full max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center" data-reveal>
          <p className="eyebrow">Zwei Wege, ein Ziel</p>
          <h2 className="mt-4 font-serif text-3xl font-semibold text-ink sm:text-4xl">
            Wählen Sie Ihren Komfort
          </h2>
        </div>
        <div className="mt-14 grid gap-8 md:grid-cols-2">
          {/* Valet */}
          <div className="card lift relative overflow-hidden p-8" data-reveal data-delay="1">
            <span className="absolute right-6 top-6 rounded-full border border-line-gold px-3 py-1 text-xs font-medium text-gold">
              Premium
            </span>
            <span className="text-gold">{keyIcon}</span>
            <h3 className="mt-4 font-serif text-2xl font-semibold text-ink">Valet – Hol &amp; Bring</h3>
            {abText(abPreise.VALET) && (
              <p className="mt-1 font-serif text-lg text-gold-gradient">{abText(abPreise.VALET)}</p>
            )}
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Der bequemste Weg: Sie fahren direkt ans Terminal, wir übernehmen Ihr Auto und stellen
              es bei Rückkehr wieder bereit. Kein Umweg, kein Shuttle.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {["Übergabe direkt am Terminal", "Kein Umsteigen, kein Warten", "Ideal bei knapper Zeit"].map((t) => (
                <li key={t} className="flex items-center gap-3 text-muted">
                  <span className="text-gold">{checkIcon}</span>{t}
                </li>
              ))}
            </ul>
            <Link href="/buchen" className="btn-outline mt-8 w-full">Valet buchen</Link>
          </div>

          {/* Shuttle */}
          <div className="card lift p-8" data-reveal data-delay="2">
            <span className="text-gold">{vanIcon}</span>
            <h3 className="mt-4 font-serif text-2xl font-semibold text-ink">Shuttle – Selbstanfahrt</h3>
            {abText(abPreise.SHUTTLE) && (
              <p className="mt-1 font-serif text-lg text-gold-gradient">{abText(abPreise.SHUTTLE)}</p>
            )}
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Die clevere Wahl: Sie parken selbst auf unserem bewachten Platz und werden im komfortablen
              Van zum Terminal gebracht – zum günstigeren Tarif.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {["Bewachter Parkplatz", "Regelmäßiger Shuttle-Service", "Bester Preis"].map((t) => (
                <li key={t} className="flex items-center gap-3 text-muted">
                  <span className="text-gold">{checkIcon}</span>{t}
                </li>
              ))}
            </ul>
            <Link href="/buchen" className="btn-outline mt-8 w-full">Shuttle buchen</Link>
          </div>
        </div>
        <p className="mt-8 text-center text-sm text-subtle">
          Preise richten sich nach Parkdauer und Fahrzeugklasse – den genauen Preis sehen Sie sofort im Buchungsassistenten.
        </p>
      </section>

      <div className="mx-auto max-w-6xl px-6"><hr className="hr-gold" /></div>

      {/* Vorteile */}
      <section className="mx-auto w-full max-w-6xl px-6 py-24">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: shieldIcon, titel: "Versichert & bewacht", text: "Ihr Fahrzeug ist während der gesamten Standzeit versichert und gesichert." },
            { icon: sparkleIcon, titel: "Aufbereitung & Service", text: "Auf Wunsch Wäsche, Innenreinigung, Politur oder Tank-/Ladeservice." },
            { icon: clockIcon, titel: "Pünktlich bereit", text: "Wir behalten Ihre Flugzeiten im Blick – Ihr Auto wartet, wenn Sie landen." },
            { icon: euroIcon, titel: "Faire, klare Preise", text: "Transparent nach Dauer und Fahrzeugklasse. Keine versteckten Kosten." },
          ].map((v, i) => (
            <div key={v.titel} data-reveal data-delay={String((i % 3) + 1)}>
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-line-gold text-gold">
                {v.icon}
              </span>
              <h3 className="mt-4 font-medium text-ink">{v.titel}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bildergalerie (nur sichtbar, wenn Bilder gepflegt sind) */}
      <Galerie />

      {/* Kundenstimmen / Google-Bewertungen */}
      <Bewertungen />

      {/* FAQ */}
      <section className="mx-auto w-full max-w-3xl px-6 py-24">
        <div className="text-center" data-reveal>
          <p className="eyebrow">Gut zu wissen</p>
          <h2 className="mt-4 font-serif text-3xl font-semibold text-ink sm:text-4xl">Häufige Fragen</h2>
        </div>
        <div className="mt-12 divide-y divide-line" data-reveal>
          {[
            { q: "Wo übergebe ich mein Auto?", a: "Beim Valet-Service direkt am Terminal zur gebuchten Zeit. Beim Shuttle parken Sie auf unserem Platz und werden zum Terminal gefahren. Die genauen Infos erhalten Sie in Ihrer Buchungsbestätigung." },
            { q: "Was passiert, wenn sich mein Flug verspätet?", a: "Kein Problem – wir richten uns nach Ihrer tatsächlichen Ankunft. Ihr Fahrzeug steht bereit, sobald Sie zurück sind." },
            { q: "Kann ich kostenlos stornieren?", a: "Ja. Bis 48 Stunden vor Anreise erstatten wir 100 %, danach 50 %. Die Stornierung erledigen Sie bequem online." },
            { q: "Ist mein Fahrzeug versichert?", a: "Ja, Ihr Fahrzeug ist während der gesamten Standzeit versichert und auf einem gesicherten Gelände untergebracht." },
          ].map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-ink">
                <span className="font-medium">{f.q}</span>
                <span className="text-gold transition-transform group-open:rotate-45">
                  <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 4v12M4 10h12" strokeLinecap="round" />
                  </svg>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Abschluss-CTA */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-24">
        <div className="card hero-bg overflow-hidden px-8 py-14 text-center" data-reveal>
          <h2 className="mx-auto max-w-2xl font-serif text-3xl font-semibold text-ink sm:text-4xl">
            Bereit für einen entspannten Start in die Reise?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted">
            Sichern Sie sich jetzt Ihren Parkplatz am Flughafen Frankfurt – in wenigen Minuten gebucht.
          </p>
          <Link href="/buchen" className="btn-gold mt-8">Jetzt Parkplatz buchen</Link>
        </div>
      </section>

      {/* Platzhalter, damit die feste Buchen-Leiste (mobil) nichts überdeckt */}
      <div className="h-20 md:hidden" />

      <SiteFooter />

      {/* Feste Buchen-Leiste – nur mobil, für schnelle Conversion */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-[#0d0f13]/95 px-4 py-3 backdrop-blur md:hidden">
        <Link href="/buchen" className="btn-gold w-full">Parkplatz buchen</Link>
      </div>
    </div>
  );
}

/* --- Inline-Icons (keine externen Abhängigkeiten) --- */
const iconProps = { className: "h-5 w-5", fill: "none", stroke: "currentColor", strokeWidth: 1.8 } as const;

const shieldIcon = (
  <svg viewBox="0 0 24 24" {...iconProps}><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" strokeLinecap="round" strokeLinejoin="round" /><path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const terminalIcon = (
  <svg viewBox="0 0 24 24" {...iconProps}><path d="M2 22h20M4 22V8l8-5 8 5v14" strokeLinecap="round" strokeLinejoin="round" /><path d="M9 22v-5h6v5" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const clockIcon = (
  <svg viewBox="0 0 24 24" {...iconProps}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const keyIcon = (
  <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="8" cy="8" r="4" /><path d="M11 11l9 9M17 17l2-2M14 14l2-2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const vanIcon = (
  <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 13l1.5-4.5A2 2 0 016.4 7h11.2a2 2 0 011.9 1.5L21 13v4h-2M5 17H3v-4" strokeLinecap="round" strokeLinejoin="round" /><circle cx="7.5" cy="17.5" r="1.6" /><circle cx="16.5" cy="17.5" r="1.6" /></svg>
);
const sparkleIcon = (
  <svg viewBox="0 0 24 24" {...iconProps}><path d="M12 3l1.8 4.9L18 9.7l-4.2 1.8L12 16l-1.8-4.5L6 9.7l4.2-1.8L12 3z" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const euroIcon = (
  <svg viewBox="0 0 24 24" {...iconProps}><path d="M16 6a6 6 0 100 12M4 10h8M4 14h7" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const checkIcon = (
  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const lockIcon = (
  <svg viewBox="0 0 24 24" {...iconProps}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
