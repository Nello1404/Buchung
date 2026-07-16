const formatEUR = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

export function centZuEUR(cent: number): string {
  return formatEUR.format(cent / 100);
}

export const formatDatumZeit = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  dateStyle: "medium",
  timeStyle: "short",
});
