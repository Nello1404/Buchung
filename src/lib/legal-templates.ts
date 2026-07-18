// Entwurfsvorlagen für die Rechtstexte. Füllfelder sind als ⟨…⟩ markiert.
// WICHTIG: Kein rechtsverbindlicher Text – vor Livegang anwaltlich prüfen lassen.
// Sobald über Admin → Rechtstexte ein Inhalt gespeichert ist, wird dieser statt
// der Vorlage angezeigt (siehe RechtsSeite).

export interface RechtsAbschnitt {
  id: string;
  titel: string;
  absaetze: string[];
}

export const IMPRESSUM_VORLAGE: RechtsAbschnitt[] = [
  {
    id: "anbieter",
    titel: "Angaben gemäß § 5 DDG",
    absaetze: [
      "⟨FIRMIERUNG lt. Handelsregister⟩",
      "⟨Rechtsform, z. B. GmbH / Einzelunternehmen⟩",
      "⟨Straße und Hausnummer⟩",
      "⟨PLZ und Ort⟩",
    ],
  },
  {
    id: "vertretung",
    titel: "Vertreten durch",
    absaetze: ["⟨Geschäftsführer bzw. Inhaber – Vor- und Nachname⟩"],
  },
  {
    id: "kontakt",
    titel: "Kontakt",
    absaetze: [
      "Telefon: ⟨Telefonnummer⟩",
      "E-Mail: info@flyspot-valet.de",
      "⟨ggf. Kontaktformular-Hinweis⟩",
    ],
  },
  {
    id: "register",
    titel: "Registereintrag",
    absaetze: [
      "Eintragung im Handelsregister.",
      "Registergericht: ⟨Amtsgericht⟩",
      "Registernummer: ⟨HRB / HRA-Nummer⟩",
      "(Entfällt bei nicht eingetragenen Einzelunternehmen.)",
    ],
  },
  {
    id: "ustid",
    titel: "Umsatzsteuer-ID",
    absaetze: [
      "Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz:",
      "⟨USt-IdNr., z. B. DE123456789⟩",
    ],
  },
  {
    id: "haftpflicht",
    titel: "Berufs-/Betriebshaftpflichtversicherung",
    absaetze: [
      "Name und Sitz des Versicherers: ⟨Versicherer, Anschrift⟩",
      "Geltungsraum der Versicherung: ⟨Geltungsbereich⟩",
      "(Für einen Verwahr-/Parkdienst dringend empfohlen und für das Vertrauen der Kunden wichtig.)",
    ],
  },
  {
    id: "verantwortlich",
    titel: "Redaktionell verantwortlich",
    absaetze: ["Verantwortlich gemäß § 18 Abs. 2 MStV: ⟨Name und Anschrift⟩"],
  },
  {
    id: "streitschlichtung",
    titel: "Streitschlichtung",
    absaetze: [
      "Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: https://ec.europa.eu/consumers/odr/. Unsere E-Mail-Adresse finden Sie oben.",
      "Wir sind ⟨nicht bereit / bereit⟩, an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.",
    ],
  },
  {
    id: "haftung",
    titel: "Haftung für Inhalte, Links & Urheberrecht",
    absaetze: [
      "Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Wir sind nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen.",
      "Unser Angebot enthält ggf. Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Für diese Inhalte ist stets der jeweilige Anbieter verantwortlich.",
      "Die durch die Seitenbetreiber erstellten Inhalte und Werke unterliegen dem deutschen Urheberrecht. Beiträge Dritter sind als solche gekennzeichnet.",
    ],
  },
];

export const DATENSCHUTZ_VORLAGE: RechtsAbschnitt[] = [
  {
    id: "verantwortlicher",
    titel: "1. Verantwortlicher",
    absaetze: [
      "Verantwortlich für die Datenverarbeitung auf dieser Website ist:",
      "⟨FIRMIERUNG⟩, ⟨Anschrift⟩, E-Mail: info@flyspot-valet.de, Telefon: ⟨Telefonnummer⟩.",
    ],
  },
  {
    id: "hosting",
    titel: "2. Hosting",
    absaetze: [
      "Diese Website wird bei Vercel gehostet. Anbieter ist ⟨Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA⟩ (bitte bestätigen).",
      "Beim Aufruf werden technisch notwendige Daten (z. B. IP-Adresse, Zeitpunkt, abgerufene Seite) in Server-Logs verarbeitet. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (sicherer, störungsfreier Betrieb). Mit Vercel besteht ein Auftragsverarbeitungsvertrag (AVV).",
    ],
  },
  {
    id: "bilder",
    titel: "3. Bild-Speicher",
    absaetze: [
      "Bilder der Website werden über ⟨Vercel Blob⟩ gespeichert und ausgeliefert (bitte bestätigen). Es werden dabei keine besonderen personenbezogenen Daten der Websitebesucher verarbeitet.",
    ],
  },
  {
    id: "buchung",
    titel: "4. Buchungs- und Fahrzeugdaten",
    absaetze: [
      "Zur Durchführung Ihrer Buchung verarbeiten wir Bestands- und Vertragsdaten: Name, E-Mail, Telefon, Buchungszeitraum, Produkt, Fahrzeugdaten (u. a. Kennzeichen), Flugnummer des Rückflugs sowie ggf. ein Übergabeprotokoll mit Fotos und Unterschrift.",
      "Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung). Die Flugnummer wird zur Ankunftszeit-Ermittlung an einen Flugdaten-Dienst (⟨AeroDataBox⟩) übermittelt (bitte bestätigen).",
    ],
  },
  {
    id: "zahlung",
    titel: "5. Zahlungsabwicklung",
    absaetze: [
      "Zahlungen werden über den Dienstleister Stripe abgewickelt: ⟨Stripe Payments Europe, Ltd., Irland⟩ (bitte bestätigen). Ihre Zahlungsdaten werden direkt an Stripe übermittelt; wir speichern keine vollständigen Kartendaten.",
      "Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).",
    ],
  },
  {
    id: "email",
    titel: "6. E-Mail-Versand",
    absaetze: [
      "Für Bestätigungs- und Service-E-Mails nutzen wir den Versanddienst ⟨Resend⟩ (bitte bestätigen). Dabei werden Ihre E-Mail-Adresse und der Nachrichteninhalt verarbeitet. Rechtsgrundlage: Art. 6 Abs. 1 lit. b bzw. lit. f DSGVO.",
    ],
  },
  {
    id: "kontakt",
    titel: "7. Kontaktaufnahme",
    absaetze: [
      "Wenn Sie uns per E-Mail kontaktieren, verarbeiten wir Ihre Angaben zur Bearbeitung der Anfrage (Art. 6 Abs. 1 lit. b bzw. lit. f DSGVO).",
    ],
  },
  {
    id: "cookies",
    titel: "8. Cookies & Reichweitenmessung",
    absaetze: [
      "Wir setzen technisch notwendige Cookies ein (z. B. für den geschützten Admin-/Fahrer-Login). Ein Einwilligungsbanner ist hierfür nicht erforderlich.",
      "⟨Falls Analyse-/Marketing-Tools eingesetzt werden (z. B. Google Analytics): hier benennen und Einwilligung per Consent-Banner einholen. Aktuell im Einsatz: keine / ⟨…⟩⟩.",
    ],
  },
  {
    id: "google-bewertungen",
    titel: "9. Google-Bewertungen",
    absaetze: [
      "⟨Sofern echte Google-Bewertungen eingebunden werden: Beim Laden können Daten an Google übermittelt werden. In diesem Fall ist vor dem Einbinden i. d. R. eine Einwilligung (Consent) erforderlich; dieser Abschnitt ist dann entsprechend zu ergänzen.⟩",
    ],
  },
  {
    id: "rechte",
    titel: "10. Ihre Rechte",
    absaetze: [
      "Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch (Art. 15–21 DSGVO). Zudem besteht ein Beschwerderecht bei einer Aufsichtsbehörde.",
      "Zuständige Aufsichtsbehörde: ⟨zuständige Landesdatenschutzbehörde, z. B. Der Hessische Beauftragte für Datenschutz und Informationsfreiheit⟩.",
    ],
  },
  {
    id: "speicherdauer",
    titel: "11. Speicherdauer",
    absaetze: [
      "Wir speichern personenbezogene Daten nur so lange, wie es für die genannten Zwecke erforderlich ist bzw. gesetzliche Aufbewahrungsfristen (z. B. handels- und steuerrechtlich, i. d. R. 6–10 Jahre) bestehen.",
    ],
  },
];

export const AGB_VORLAGE: RechtsAbschnitt[] = [
  {
    id: "geltung",
    titel: "§ 1 Geltungsbereich",
    absaetze: [
      "Diese Allgemeinen Geschäftsbedingungen gelten für alle Verträge zwischen ⟨FIRMIERUNG⟩ (nachfolgend „Anbieter“) und dem Kunden über Valet- und Shuttle-Parkleistungen am Flughafen Frankfurt.",
    ],
  },
  {
    id: "leistungen",
    titel: "§ 2 Leistungen (Valet & Shuttle)",
    absaetze: [
      "Valet (Hol & Bring): Der Kunde übergibt sein Fahrzeug zur vereinbarten Zeit am Terminal. Der Anbieter verbringt das Fahrzeug auf einen gesicherten Stellplatz und stellt es zur Rückkehr wieder am vereinbarten Ort bereit.",
      "Shuttle (Selbstanfahrt): Der Kunde parkt selbst auf dem bewachten Gelände des Anbieters und wird mit einem Shuttle zum Terminal und zurück befördert.",
      "Zusatzleistungen (z. B. Fahrzeugaufbereitung, Tank-/Ladeservice) werden nur bei ausdrücklicher Beauftragung erbracht.",
    ],
  },
  {
    id: "vertragsschluss",
    titel: "§ 3 Vertragsschluss",
    absaetze: [
      "Die Darstellung der Leistungen im Buchungsportal ist eine Aufforderung zur Abgabe eines Angebots. Mit Absenden der Buchung gibt der Kunde ein verbindliches Angebot ab. Der Vertrag kommt mit der Buchungsbestätigung (per E-Mail) zustande.",
    ],
  },
  {
    id: "preise",
    titel: "§ 4 Preise & Zahlung",
    absaetze: [
      "Es gelten die zum Buchungszeitpunkt im Portal angezeigten Preise (inkl. gesetzlicher USt.), abhängig von Parkdauer und Fahrzeugklasse. Die Zahlung erfolgt online über den Zahlungsdienstleister bzw. bei manuellen Buchungen wie vereinbart.",
    ],
  },
  {
    id: "storno",
    titel: "§ 5 Stornierung & Erstattung",
    absaetze: [
      "Eine Stornierung ist bis 48 Stunden vor der gebuchten Anreise kostenfrei möglich; in diesem Fall werden 100 % des Betrags erstattet.",
      "Bei Stornierung weniger als 48 Stunden vor der Anreise werden 50 % des Betrags erstattet.",
      "Maßgeblich ist der Zeitpunkt des Eingangs der Stornierung. Die Stornierung erfolgt online über die dafür vorgesehene Funktion.",
    ],
  },
  {
    id: "pflichten",
    titel: "§ 6 Pflichten des Kunden",
    absaetze: [
      "Der Kunde erscheint zur vereinbarten Zeit am vereinbarten Ort. Bei Valet übergibt er das Fahrzeug betriebsbereit inkl. Fahrzeugschlüssel. Das Fahrzeug muss verkehrssicher und ordnungsgemäß versichert/zugelassen sein.",
      "Wertgegenstände sind vor der Übergabe zu entfernen. Der Kunde stellt sicher, dass die im Fahrzeug befindlichen Gegenstände korrekt angegeben sind.",
    ],
  },
  {
    id: "obhut",
    titel: "§ 7 Obhut & Haftung",
    absaetze: [
      "Der Anbieter verwahrt das Fahrzeug mit der Sorgfalt eines ordentlichen Kaufmanns. Der Anbieter haftet nach den gesetzlichen Bestimmungen für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit sowie für Vorsatz und grobe Fahrlässigkeit.",
      "Für leichte Fahrlässigkeit haftet der Anbieter nur bei Verletzung wesentlicher Vertragspflichten und begrenzt auf den vertragstypischen, vorhersehbaren Schaden. ⟨Haftungsdetails / Höchstsummen mit Anwalt und Versicherer abstimmen⟩.",
    ],
  },
  {
    id: "protokoll",
    titel: "§ 8 Übergabeprotokoll",
    absaetze: [
      "Zustand, Kilometerstand und etwaige Vorschäden des Fahrzeugs werden bei Übernahme und Rückgabe in einem Übergabeprotokoll (inkl. Fotos und Unterschrift) dokumentiert. Das Protokoll dient beiden Parteien als Nachweis.",
    ],
  },
  {
    id: "widerruf",
    titel: "§ 9 Widerrufsrecht bei Dienstleistungen",
    absaetze: [
      "Verbrauchern steht grundsätzlich ein 14-tägiges Widerrufsrecht zu. Bei Dienstleistungen erlischt das Widerrufsrecht, wenn der Anbieter die Dienstleistung vollständig erbracht hat und mit der Ausführung erst begonnen wurde, nachdem der Verbraucher ausdrücklich zugestimmt und seine Kenntnis vom Erlöschen bestätigt hat.",
      "⟨Vollständige, rechtssichere Widerrufsbelehrung inkl. Muster-Widerrufsformular durch Anwalt ergänzen.⟩",
    ],
  },
  {
    id: "schluss",
    titel: "§ 10 Schlussbestimmungen",
    absaetze: [
      "Es gilt das Recht der Bundesrepublik Deutschland. Sollten einzelne Bestimmungen unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt. ⟨Gerichtsstand nur wenn zulässig – mit Anwalt klären⟩.",
    ],
  },
];

export const VORLAGEN: Record<string, RechtsAbschnitt[]> = {
  impressum: IMPRESSUM_VORLAGE,
  datenschutz: DATENSCHUTZ_VORLAGE,
  agb: AGB_VORLAGE,
};
