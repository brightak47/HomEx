import { verifyStripeWebhook } from "@/lib/adapters/payments";
import { completeTicketPurchase } from "@/lib/premieres";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "Missing signature" }, { status: 400 });

  try {
    const body = await request.text();
    const event = verifyStripeWebhook(body, signature);
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as {
        client_reference_id?: string | null;
        metadata?: { orderId?: string };
        id: string;
      };
      const orderId = session.client_reference_id || session.metadata?.orderId;
      if (orderId) {
        await completeTicketPurchase({ orderId, providerRef: session.id });
      }
    }
    if (event.type === "charge.refunded") {
      const charge = event.data.object as { payment_intent?: string };
      if (charge.payment_intent) {
        const payment = await db.payment.findFirst({
          where: { providerRef: String(charge.payment_intent) },
        });
        if (payment) {
          await db.ticket.updateMany({
            where: { orderId: payment.orderId },
            data: { status: "REFUNDED" },
          });
        }
      }
    }
    return Response.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook failed";
    return Response.json({ error: message }, { status: 400 });
  }
}
