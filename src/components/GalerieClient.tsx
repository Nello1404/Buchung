"use client";

/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useState } from "react";
import type { GalerieGruppe } from "@/lib/site-images";

const kameraIcon = (
  <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.4">
    <path d="M3 8a2 2 0 012-2h2l1.5-2h7L18 6h2a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12.5" r="3.2" />
  </svg>
);

export function GalerieClient({ gruppen }: { gruppen: GalerieGruppe[] }) {
  // Lightbox-Zustand: Index der Kategorie + Bildindex, oder null.
  const [box, setBox] = useState<{ g: number; i: number } | null>(null);

  const schliessen = useCallback(() => setBox(null), []);
  const bilder = box ? gruppen[box.g].bilder : [];

  const naechstes = useCallback(() => {
    setBox((b) => (b ? { ...b, i: (b.i + 1) % gruppen[b.g].bilder.length } : b));
  }, [gruppen]);
  const vorheriges = useCallback(() => {
    setBox((b) => (b ? { ...b, i: (b.i - 1 + gruppen[b.g].bilder.length) % gruppen[b.g].bilder.length } : b));
  }, [gruppen]);

  useEffect(() => {
    if (!box) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") schliessen();
      if (e.key === "ArrowRight") naechstes();
      if (e.key === "ArrowLeft") vorheriges();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [box, schliessen, naechstes, vorheriges]);

  return (
    <>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {gruppen.map((g, gi) => {
          const erstes = g.bilder[0];
          const hatBilder = Boolean(erstes);
          const inhalt = (
            <>
              {hatBilder ? (
                <Image
                  src={erstes.url}
                  alt={erstes.alt || g.info.label}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-subtle">
                  {kameraIcon}
                  <span className="text-xs tracking-wide">Bild folgt</span>
                </div>
              )}
              {/* Verlauf für Lesbarkeit */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-left">
                <h3 className="font-serif text-base font-semibold text-ink">{g.info.label}</h3>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted">
                  {hatBilder ? g.info.beschreibung : "Demnächst mit echten Fotos"}
                </p>
              </div>
              {hatBilder && g.bilder.length > 1 && (
                <span className="absolute right-3 top-3 rounded-full bg-black/55 px-2 py-0.5 text-xs text-ink backdrop-blur">
                  {g.bilder.length} Fotos
                </span>
              )}
            </>
          );

          const klasse =
            "group relative aspect-[4/3] overflow-hidden rounded-2xl border border-line outline-none focus-visible:ring-2 focus-visible:ring-gold";

          return hatBilder ? (
            <button
              key={g.info.code}
              type="button"
              onClick={() => setBox({ g: gi, i: 0 })}
              aria-label={`${g.info.label} – Bilder ansehen`}
              className={`${klasse} cursor-pointer`}
            >
              {inhalt}
            </button>
          ) : (
            <div key={g.info.code} className={klasse} aria-label={`${g.info.label} – Bild folgt`}>
              {inhalt}
            </div>
          );
        })}
      </div>

      {/* Lightbox – per Portal an document.body, damit sie über allem liegt
          und nicht von transformierten Eltern-Containern eingefangen wird. */}
      {box && bilder[box.i] && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${gruppen[box.g].info.label} – Bildansicht`}
          onClick={schliessen}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4 motion-safe:animate-[fadeIn_.2s_ease]"
        >
          <button
            type="button"
            onClick={schliessen}
            aria-label="Schließen"
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-gold"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>
          </button>

          <div className="relative max-h-[85vh] max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <img
              src={bilder[box.i].url}
              alt={bilder[box.i].alt || gruppen[box.g].info.label}
              className="max-h-[85vh] w-auto rounded-xl object-contain"
            />
            <p className="mt-3 text-center text-sm text-muted">
              {gruppen[box.g].info.label}
              {bilder.length > 1 ? ` · ${box.i + 1} / ${bilder.length}` : ""}
            </p>

            {bilder.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={vorheriges}
                  aria-label="Vorheriges Bild"
                  className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-black/40 text-ink outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-gold"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <button
                  type="button"
                  onClick={naechstes}
                  aria-label="Nächstes Bild"
                  className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-black/40 text-ink outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-gold"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
