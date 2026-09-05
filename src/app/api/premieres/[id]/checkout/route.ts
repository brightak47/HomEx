import { jsonError, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createTicketCheckout, paymentsProvider } from "@/lib/adapters/payments";
import { completeTicketPurchase, getPremiereForUser } from "@/lib/premieres";
import { canBuyTicket } from "@/lib/lifecycle";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const limited = rateLimit(`checkout:${user.id}`, 8);
    if (!limited.ok) return Response.json({ error: "Too many checkout attempts" }, { status: 429 });

    const { id } = await context.params;
    const result = await getPremiereForUser(id, user.id);
    if (!result) return Response.json({ error: "Premiere not found" }, { status: 404 });
    if (result.ticket) {
      return Response.json({ alreadyOwned: true, ticketId: result.ticket.id });
    }
    if (!canBuyTicket(result.dto.status)) {
      return Response.json({ error: "Tickets are not on sale" }, { status: 409 });
    }

    const appUrl = process.env.APP_URL ?? new URL(request.url).origin;
    const order = await db.order.create({
      data: {
        userId: user.id,
        premiereId: id,
        status: "PENDING",
        totalCents: result.dto.ticketPriceCents,
        currency: result.dto.currency,
        provider: paymentsProvider(),
      },
    });

    const checkout = await createTicketCheckout({
      orderId: order.id,
      premiereId: id,
      premiereTitle: result.dto.title,
      amountCents: result.dto.ticketPriceCents,
      currency: result.dto.currency,
      customerEmail: user.email,
      successUrl: `${appUrl}/tickets/confirmed/${id}?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${appUrl}/checkout/${id}`,
    });

    await db.order.update({
      where: { id: order.id },
      data: { providerRef: checkout.providerRef },
    });

    if (checkout.demoCompleted) {
      const ticket = await completeTicketPurchase({
        orderId: order.id,
        providerRef: checkout.providerRef,
      });
      return Response.json({
        demo: true,
        ticketId: ticket.id,
        redirectTo: `/tickets/confirmed/${id}`,
      });
    }

    return Response.json({ checkoutUrl: checkout.checkoutUrl, orderId: order.id });
  } catch (error) {
    return jsonError(error);
  }
}
