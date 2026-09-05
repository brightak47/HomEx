import { db } from "../db";

export type NotificationType =
  | "TICKET_PURCHASED"
  | "PREMIERE_REMINDER_24H"
  | "PREMIERE_REMINDER_1H"
  | "PREMIERE_REMINDER_15M"
  | "PREMIERE_STARTING"
  | "GUEST_ANNOUNCEMENT"
  | "POST_PREMIERE"
  | "INVITE_SENT";

export async function notifyUser(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  premiereId?: string;
}) {
  const record = await db.notification.create({
    data: input,
  });

  if (process.env.RESEND_API_KEY) {
    // Adapter hook: swap in Resend or another email provider without changing callers.
  }

  return record;
}

export async function notifyTicketPurchase(input: {
  userId: string;
  premiereId: string;
  title: string;
}) {
  return notifyUser({
    userId: input.userId,
    premiereId: input.premiereId,
    type: "TICKET_PURCHASED",
    title: "Ticket confirmed",
    body: `You're in for ${input.title}. We'll remind you before the premiere.`,
  });
}
