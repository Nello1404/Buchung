import type { Metadata } from "next";
import { AblaufFilm } from "@/components/AblaufFilm";

export const metadata: Metadata = {
  title: "So funktioniert's – FlySpot Valet",
  description:
    "Erleben Sie den FlySpot-Valet-Ablauf als scrollbaren Film: von der Übergabe am Terminal bis zum sicheren, beleuchteten Stellplatz – aus der Vogelperspektive.",
};

export default function AblaufSeite() {
  return <AblaufFilm />;
}
