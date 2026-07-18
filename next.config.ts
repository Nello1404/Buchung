import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Vom Admin hochgeladene Bilder liegen in Vercel Blob.
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
