# FlySpot Valet – Buchungsportal

Valet- und Shuttle-Parken am Flughafen Frankfurt. Dieses Repository enthält **Phase 1**
(Buchungsstrecke): Startseite mit Buchungswidget → Live-Preisberechnung → Zusatzservices →
Kundendaten → Stripe-Zahlung → Bestätigung + E-Mail. Inklusive Storno mit anteiliger
Erstattung und hartem Überbuchungsschutz.

## Tech-Stack

- Next.js 16 (App Router) + TypeScript, Tailwind CSS
- PostgreSQL + Prisma ORM 7 (Driver-Adapter `@prisma/adapter-pg`)
- Stripe (Checkout + Webhooks)
- Resend für Transaktions-E-Mails (deutsche Templates)
- Vitest für automatisierte Tests

## Lokales Setup

### 1. Voraussetzungen

- Node.js ≥ 20.9
- Eine lokale PostgreSQL-Datenbank (Version 14+)

### 2. Abhängigkeiten installieren

```bash
npm install
```

### 3. Datenbank anlegen

```bash
psql -c "CREATE USER flyspot WITH PASSWORD 'flyspot_dev' CREATEDB;"
psql -c "CREATE DATABASE flyspot_valet OWNER flyspot;"
```

### 4. Umgebungsvariablen

```bash
cp .env.example .env
```

Trage in `.env` mindestens `DATABASE_URL` ein (Standardwert passt zum Setup aus Schritt 3).
Für den vollständigen Zahlungs-/E-Mail-Test werden zusätzlich benötigt:

- **Stripe**: Testmodus-Keys aus dem [Stripe-Dashboard](https://dashboard.stripe.com/test/apikeys)
  (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`).
- **Stripe-Webhook**: Für lokale Tests die [Stripe CLI](https://docs.stripe.com/stripe-cli) nutzen:
  ```bash
  stripe listen --forward-to localhost:3000/api/stripe/webhook
  ```
  Das ausgegebene `whsec_...` in `STRIPE_WEBHOOK_SECRET` eintragen.
- **Resend**: `RESEND_API_KEY` aus [resend.com](https://resend.com/api-keys). Ohne Key werden
  E-Mails nur in die Server-Konsole geloggt (praktisch für die lokale Entwicklung, es passiert
  aber kein echter Versand).

### 5. Datenbankschema anwenden + Testdaten laden

```bash
npm run db:migrate
npm run db:seed
```

Der Seed legt an: Produkte (Valet/Shuttle), Beispieltarife, einen Beispiel-Saisonzeitraum
(Sommerferien Hessen 2026), Zusatzservices, Kapazität für die nächsten 365 Tage
(99 Valet / 43 Shuttle pro Tag) sowie einen Test-Gutschein (`WILLKOMMEN1`, gebunden an
`test@example.com`) zum Ausprobieren der Gutschein-Einlösung.

### 6. Entwicklungsserver starten

```bash
npm run dev
```

Öffne <http://localhost:3000>.

## Akzeptanztest durchspielen

1. Auf der Startseite **„Jetzt Parkplatz buchen"** klicken.
2. Zeitraum + Produkt wählen (Preis wird live berechnet, inkl. Saison-Aufschlag falls
   zutreffend).
3. Optional Zusatzservices wählen.
4. Kundendaten, Kennzeichen und (bei Valet) Flugnummer eingeben. Testweise den
   Gutscheincode `WILLKOMMEN1` mit der E-Mail `test@example.com` ausprobieren.
5. Auf **„Jetzt kostenpflichtig buchen"** klicken → Weiterleitung zu Stripe Checkout
   (Testmodus). Testkarte: `4242 4242 4242 4242`, beliebiges zukünftiges Datum, beliebiger
   CVC.
6. Nach erfolgreicher Zahlung: Weiterleitung zur Bestätigungsseite (Buchungsnummer,
   Rechnungs-Download als PDF). Bestätigungs-E-Mail wird versendet (bzw. in der Konsole
   geloggt).
7. Storno testen unter **„Buchung stornieren"** (Startseite) mit Buchungsnummer + E-Mail:
   ≥ 48h vor Anreise 100 % Erstattung, danach 50 % (Stripe-Refund im Testmodus).

## Automatisierte Tests

```bash
npm test
```

Deckt ab: alle Tarif-Staffeln, Saison-Aufschlag, Sperrtage, Zusatzservices, Gutschein-Logik,
USt-Ausweis, harter Überbuchungsschutz (inkl. paralleler Buchungsversuche auf den letzten
freien Platz) sowie die Storno-/Erstattungsberechnung. Die Kapazitätstests laufen gegen die
echte lokale Datenbank (siehe Setup oben) und verwenden dafür ausschließlich Testtage im
Jahr 2099, um echte Kapazitätsdaten nicht zu beeinflussen.

## Tarife, Kapazität & Preise ändern

Ein Admin-Bereich folgt in **Phase 2**. Bis dahin lassen sich alle Preise, Tarif-Staffeln,
Saisonzeiträume, Sperrtage, Kapazitätskontingente und Zusatzservices direkt über
**Prisma Studio** pflegen (grafische Datenbank-Oberfläche, kein SQL nötig):

```bash
npm run db:studio
```

Relevante Tabellen: `TariffRule` (Preis pro Tag je Staffel/Produkt), `SeasonRate`
(Saison-Festpreise), `BlockedDay` (Sperrtage), `CapacityDay` (Kontingent je Tag/Produkt),
`ServiceAddon` (Zusatzservices), `Settings` (Storno-Frist & Erstattungssätze).

Alternativ per Skript: `prisma/seed.ts` anpassen und `npm run db:seed` erneut ausführen
(bestehende Tarife/Saisonpreise werden dabei ersetzt, Kapazitätstage nur ergänzt).

## Wichtige Design-Entscheidungen (Phase 1)

- **Gast-Checkout ohne Login**: Kundenkonten (Magic Link) folgen in Phase 2 zusammen mit
  den Admin-/Fahrer-Rollen. Der Treue-Gutschein ist stattdessen an die E-Mail-Adresse
  gebunden.
- **Volle Kalendertage**: Ein Tag zählt vom Anreisetag (inklusive) bis zum Tag vor der
  Abreise (der Abreisetag selbst ist kostenfrei, da das Fahrzeug an diesem Tag bereits
  abgeholt wird). Alle Zeiten werden als Europe/Berlin-Wanduhrzeit interpretiert
  (Sommer-/Winterzeit wird korrekt berücksichtigt).
- **Saison-Preise ersetzen** für die betroffenen Tage den regulären Staffelpreis
  vollständig (kein zusätzlicher Aufschlag).
- **Gutschein "1 Tag gratis"**: Der Rabatt entspricht immer dem Tagespreis der
  Langzeit-Staffel (> 7 Tage) des jeweils gebuchten Produkts – unabhängig von der
  tatsächlichen Aufenthaltsdauer.
- **Kapazitätsreservierung**: Ein Kontingent-Slot wird atomar reserviert, sobald die
  Buchung angelegt wird (vor der Stripe-Weiterleitung), nicht erst nach Zahlungseingang.
  Bricht die Zahlung ab oder läuft die Checkout-Session ab (30 Minuten), wird das
  Kontingent automatisch wieder freigegeben (`checkout.session.expired`-Webhook).
- **Zusatzservices**: Werden für Kunden mit Standzeit automatisch während des Aufenthalts
  ausgeführt (kein separater Termin). Ein eigenständiger Buchungsweg für externe Kunden
  ohne Parkbuchung (nur Zusatzservice + Terminwahl) ist **nicht** Teil von Phase 1 –
  bitte bestätigen, ob das in Phase 2 ergänzt werden soll.
- **Preise**: Werden ausschließlich serverseitig berechnet (`src/lib/pricing.ts`) und bei
  Buchungserstellung als Snapshot gespeichert; dem Client wird nie vertraut.

## Rechtliches – Hinweisliste Auftragsverarbeitungsverträge (AVV)

Für den Produktivbetrieb sollten mit folgenden Dienstleistern AV-Verträge (Art. 28 DSGVO)
abgeschlossen bzw. deren Standard-DPA akzeptiert werden (bitte durch Ihren Anwalt prüfen
lassen):

| Dienstleister | Zweck | Hinweis |
| --- | --- | --- |
| Stripe | Zahlungsabwicklung | Stripe bietet ein Standard-DPA im Dashboard an |
| Resend | Transaktions-E-Mail-Versand | DPA über Resend-Account abschließbar |
| Vercel | Hosting | Vercel-DPA (Teil der Terms) |
| Postgres-Hosting-Anbieter | Datenbank | Abhängig vom gewählten Anbieter (z. B. Vercel Postgres, Neon, Supabase) |
| Cookie-freier Analytics-Anbieter (falls extern gehostet) | Reichweitenmessung | Nur falls kein Self-Hosting |
| Flugdaten-API-Anbieter (Phase 4) | Flugstatus-Abfrage | Nur Flugnummer/-zeiten, Prüfung durch Anwalt empfohlen |

Zusätzlich benötigt (nicht Teil dieses Repos): Impressum, Datenschutzerklärung und AGB als
Inhalte (Text liefert Ihr Anwalt) sowie ein Löschkonzept für Buchungsdaten nach Ablauf der
gesetzlichen Aufbewahrungsfristen (Phase 2/Admin).

## Deployment (Vercel)

1. Repository mit Vercel verbinden.
2. Managed-Postgres-Datenbank anlegen (z. B. Vercel Postgres/Neon) und `DATABASE_URL` als
   Umgebungsvariable in Vercel setzen.
3. Alle Variablen aus `.env.example` in den Vercel-Projekteinstellungen hinterlegen
   (Live-Keys für Stripe/Resend, `NEXT_PUBLIC_BASE_URL` auf die Produktions-Domain setzen).
4. Migrationen gegen die Produktions-DB anwenden: `npx prisma migrate deploy`.
5. Stripe-Webhook-Endpoint im Stripe-Dashboard auf
   `https://www.flyspot-valet.de/api/stripe/webhook` eintragen und das Signing-Secret in
   `STRIPE_WEBHOOK_SECRET` hinterlegen.

## Nächste Schritte

Siehe Projektauftrag: Phase 2 (Admin & Betrieb), Phase 3 (Übergabeprotokoll), Phase 4
(Automatisierung).
