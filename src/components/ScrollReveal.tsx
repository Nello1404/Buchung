"use client";

import { useEffect } from "react";

// Faded Elemente mit [data-reveal] beim Sichtbarwerden sanft ein.
// Respektiert prefers-reduced-motion: dann passiert nichts, alles bleibt sichtbar.
// Ohne JS bleibt ebenfalls alles sichtbar (die Startzustände greifen nur unter .reveal-on).
export function ScrollReveal() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = document.documentElement;
    root.classList.add("reveal-on");

    const elemente = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (elemente.length === 0) return;

    const io = new IntersectionObserver(
      (eintraege) => {
        for (const e of eintraege) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );
    elemente.forEach((el) => io.observe(el));

    return () => io.disconnect();
  }, []);

  return null;
}
