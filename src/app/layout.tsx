import type { Metadata } from "next";
import { Geist, Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "FlySpot Valet – Premium-Parken am Flughafen Frankfurt",
  description:
    "Valet- und Shuttle-Parken am Flughafen Frankfurt. Ihr Auto in besten Händen – direkt am Terminal übergeben, entspannt in den Urlaub starten.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={`${geistSans.variable} ${playfair.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        {children}
        {/* Cookielose Besucher-Statistik (Vercel Web Analytics) – kein Consent-Banner nötig. */}
        <Analytics />
      </body>
    </html>
  );
}
