export const CONTENT_SEITEN = [
  { slug: "impressum", titel: "Impressum" },
  { slug: "datenschutz", titel: "Datenschutz" },
  { slug: "agb", titel: "AGB" },
] as const;

export type ContentSlug = (typeof CONTENT_SEITEN)[number]["slug"];

export function istGueltigerSlug(slug: string): slug is ContentSlug {
  return CONTENT_SEITEN.some((s) => s.slug === slug);
}
