import Stripe from "stripe";

let client: Stripe | undefined;

/** Lazily erzeugter Stripe-Client (Testmodus- oder Live-Key aus STRIPE_SECRET_KEY). */
export function getStripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error(
        "STRIPE_SECRET_KEY fehlt. Bitte in .env setzen (Testmodus-Key aus dem Stripe-Dashboard)."
      );
    }
    client = new Stripe(key);
  }
  return client;
}
