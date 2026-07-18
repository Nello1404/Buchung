import { getReviews, getReviewSummary } from "@/lib/reviews";
import { BewertungenSlider } from "@/components/BewertungenSlider";

export async function Bewertungen() {
  const [reviews, summary] = await Promise.all([getReviews(), getReviewSummary()]);
  if (reviews.length === 0) return null;

  return (
    <section id="bewertungen" className="w-full overflow-hidden py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center" data-reveal>
          <p className="eyebrow">Kundenstimmen</p>
          <h2 className="mt-4 font-serif text-3xl font-semibold text-ink sm:text-4xl">
            Das sagen unsere Kunden
          </h2>
          <div className="mt-5 flex items-center justify-center gap-3 text-sm">
            <span className="font-serif text-2xl font-semibold text-gold-gradient">
              {summary.schnitt.toLocaleString("de-DE", { minimumFractionDigits: 1 })}
            </span>
            <span className="flex gap-0.5" aria-hidden>
              {[1, 2, 3, 4, 5].map((i) => (
                <svg key={i} viewBox="0 0 20 20" className="h-4 w-4" fill={i <= Math.round(summary.schnitt) ? "var(--gold)" : "none"} stroke="var(--gold)" strokeWidth="1.3">
                  <path d="M10 1.8l2.5 5 5.5.8-4 3.9.9 5.5L10 14.4 5.1 17l.9-5.5-4-3.9 5.5-.8z" strokeLinejoin="round" />
                </svg>
              ))}
            </span>
            <span className="text-muted">aus {summary.anzahl} Bewertungen</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6" data-reveal>
        <BewertungenSlider reviews={reviews} />
      </div>
    </section>
  );
}
