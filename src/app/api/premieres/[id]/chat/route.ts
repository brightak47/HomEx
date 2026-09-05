import { z } from "zod";
import { jsonError, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const messages = await db.chatMessage.findMany({
    where: { premiereId: id },
    include: { user: { select: { name: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  return Response.json({
    messages: messages.reverse().map((message) => ({
      id: message.id,
      body: message.body,
      name: message.user.name,
      role: message.user.role,
      createdAt: message.createdAt,
    })),
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const { body } = z.object({ body: z.string().min(1).max(240) }).parse(await request.json());
    const ticket = await db.ticket.findFirst({
      where: { premiereId: id, userId: user.id, status: { in: ["PAID", "USED"] } },
    });
    const invited = await db.guestInvitation.findFirst({
      where: { premiereId: id, email: user.email, status: "ACCEPTED" },
    });
    if (!ticket && !invited && user.role !== "ADMIN" && user.role !== "PRODUCER") {
      return Response.json({ error: "Ticket required" }, { status: 403 });
    }
    const message = await db.chatMessage.create({
      data: { premiereId: id, userId: user.id, body },
    });
    return Response.json({ message });
  } catch (error) {
    return jsonError(error);
  }
}
