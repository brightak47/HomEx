import Stripe from "stripe";
import type { PaymentCheckoutInput, PaymentCheckoutResult } from "./types";

function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export function paymentsProvider() {
  return process.env.STRIPE_SECRET_KEY ? "stripe" : "demo";
}

export async function createTicketCheckout(
  input: PaymentCheckoutInput,
): Promise<PaymentCheckoutResult> {
  const stripe = stripeClient();
  if (!stripe) {
    return {
      provider: "demo",
      demoCompleted: true,
      providerRef: `demo_${input.orderId}`,
    };
  }

  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: input.customerEmail,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    client_reference_id: input.orderId,
    metadata: {
      orderId: input.orderId,
      premiereId: input.premiereId,
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: input.currency.toLowerCase(),
          unit_amount: input.amountCents,
          product_data: {
            name: `${input.premiereTitle} premiere ticket`,
          },
        },
      },
    ],
    integration_identifier: `homex_ticket_${suffix}`,
  } as Stripe.Checkout.SessionCreateParams);

  return {
    provider: "stripe",
    checkoutUrl: session.url ?? undefined,
    providerRef: session.id,
  };
}

export function verifyStripeWebhook(body: string, signature: string) {
  const stripe = stripeClient();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    throw new Error("Stripe webhook is not configured");
  }
  return stripe.webhooks.constructEvent(body, signature, secret);
}
