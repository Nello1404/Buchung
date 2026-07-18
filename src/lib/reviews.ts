// Bewertungen – austauschbare Datenquelle.
//
// AKTUELL: Demo-Daten (Platzhalter), damit der Abschnitt sofort läuft.
//
// SPÄTER echte Google-Bewertungen anbinden – zwei übliche Wege:
//
//  A) Offizielle Google Places API (empfohlen für volle Kontrolle)
//     - Google Cloud Console → Places API aktivieren → API-Key als
//       Umgebungsvariable GOOGLE_PLACES_API_KEY setzen; dazu die PLACE_ID des
//       Betriebs. Dann hier in getReviews() serverseitig abrufen und cachen.
//     + Vorteil: eigene Gestaltung, DSGVO-freundlich (Server-zu-Server, kein
//       Google-Script im Browser → i. d. R. kein Consent-Banner nötig).
//     - Nachteil: Google liefert nur die letzten ~5 Bewertungen; Aufwand + ggf.
//       Kosten oberhalb des Freikontingents.
//
//  B) Bewertungs-Widget-Dienst (z. B. Elfsight, Trustindex, EmbedSocial)
//     + Vorteil: schnell eingebunden, zeigt oft alle Bewertungen.
//     - Nachteil: lädt fremde Skripte/Styles → Consent nötig, weniger
//       Gestaltungshoheit, meist kostenpflichtig.
//
// WICHTIG: Keinen kostenpflichtigen Dienst ohne Rücksprache wählen. Nur die
// Funktion getReviews()/getReviewSummary() austauschen – die Oberfläche bleibt.

export interface Review {
  id: string;
  autor: string;
  datumISO: string; // YYYY-MM-DD
  sterne: number; // 1..5
  text: string;
}

const DEMO_REVIEWS: Review[] = [
  { id: "1", autor: "Michael K.", datumISO: "2026-06-28", sterne: 5, text: "Absolut stressfrei. Auto am Terminal abgegeben, nach dem Urlaub stand es sauber und pünktlich bereit. Genau so muss das sein." },
  { id: "2", autor: "Sabine R.", datumISO: "2026-06-15", sterne: 5, text: "Sehr freundliches Team und alles super organisiert. Die Übergabe ging schnell, ich habe meinen Flug entspannt erreicht." },
  { id: "3", autor: "Thomas B.", datumISO: "2026-05-30", sterne: 5, text: "Top Service zu einem fairen Preis. Der Shuttle kam sofort. Komme definitiv wieder." },
  { id: "4", autor: "Nadine W.", datumISO: "2026-05-12", sterne: 4, text: "Alles reibungslos, Auto war einwandfrei. Kleiner Stern Abzug nur wegen kurzer Wartezeit bei der Rückgabe – sonst top." },
  { id: "5", autor: "Jens P.", datumISO: "2026-04-25", sterne: 5, text: "Ankunft verspätet, trotzdem stand das Auto bereit. Man merkt, dass die Flüge im Blick behalten werden. Klasse!" },
  { id: "6", autor: "Aylin D.", datumISO: "2026-04-08", sterne: 5, text: "Premium-Gefühl von Anfang bis Ende. Fahrzeug frisch gewaschen zurückbekommen. Sehr empfehlenswert." },
];

export async function getReviews(): Promise<Review[]> {
  // TODO: hier später echte Bewertungen laden (siehe Kopf dieser Datei).
  return DEMO_REVIEWS;
}

export interface ReviewSummary {
  schnitt: number; // Durchschnitt, z. B. 4.8
  anzahl: number;
}

export async function getReviewSummary(): Promise<ReviewSummary> {
  const reviews = await getReviews();
  const anzahl = reviews.length;
  const schnitt = anzahl ? Math.round((reviews.reduce((s, r) => s + r.sterne, 0) / anzahl) * 10) / 10 : 0;
  // Hinweis: Bei echter Anbindung hier die von Google gemeldete Gesamtzahl/
  // Durchschnittsnote verwenden (kann höher sein als die Zahl der Textbewertungen).
  return { schnitt, anzahl };
}
