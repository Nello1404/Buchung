"use client";

import { useEffect, useRef } from "react";
import type { Review } from "@/lib/reviews";

const dfmt = new Intl.DateTimeFormat("de-DE", { year: "numeric", month: "long" });

function Sterne({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${n} von 5 Sternen`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 20 20" className="h-4 w-4" fill={i <= n ? "var(--gold)" : "none"} stroke="var(--gold)" strokeWidth="1.3">
          <path d="M10 1.8l2.5 5 5.5.8-4 3.9.9 5.5L10 14.4 5.1 17l.9-5.5-4-3.9 5.5-.8z" strokeLinejoin="round" />
        </svg>
      ))}
    </div>
  );
}

export function BewertungenSlider({ reviews }: { reviews: Review[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const pausiert = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; // kein Auto-Scroll

    let raf = 0;
    const tick = () => {
      if (!pausiert.current && el.scrollWidth > el.clientWidth) {
        el.scrollLeft += 0.5;
        // Nahtlose Schleife: bei Hälfte (Ende der 1. Kopie) zurücksetzen
        if (el.scrollLeft >= el.scrollWidth / 2) el.scrollLeft -= el.scrollWidth / 2;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Für die nahtlose Schleife die Liste verdoppeln.
  const liste = [...reviews, ...reviews];

  return (
    <div
      ref={ref}
      onMouseEnter={() => (pausiert.current = true)}
      onMouseLeave={() => (pausiert.current = false)}
      onTouchStart={() => (pausiert.current = true)}
      onTouchEnd={() => (pausiert.current = false)}
      className="mt-12 flex snap-x gap-5 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {liste.map((r, i) => (
        <article
          key={`${r.id}-${i}`}
          aria-hidden={i >= reviews.length}
          className="card flex w-[300px] shrink-0 snap-start flex-col p-6 sm:w-[340px]"
        >
          <div className="flex items-center justify-between">
            <Sterne n={r.sterne} />
            <span className="text-xs text-subtle">{dfmt.format(new Date(r.datumISO))}</span>
          </div>
          <p className="mt-4 flex-1 text-sm leading-relaxed text-muted">„{r.text}“</p>
          <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
            <span className="text-sm font-medium text-ink">{r.autor}</span>
            <span className="inline-flex items-center gap-1 text-xs text-subtle">
              <svg viewBox="0 0 24 24" className="h-4 w-4"><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.2s2.7-6.2 6-6.2c1.9 0 3.1.8 3.8 1.5l2.6-2.5C17.1 6.3 14.8 5.3 12 5.3 6.9 5.3 2.8 9.4 2.8 14.5S6.9 23.7 12 23.7c5.9 0 9.8-4.1 9.8-9.9 0-.7-.1-1.2-.2-1.7z" transform="translate(0 -2.5)" /></svg>
              bei Google
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
