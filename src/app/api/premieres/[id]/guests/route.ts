import { z } from "zod";
import { jsonError, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifyUser } from "@/lib/adapters/notifications";
import { writeAudit } from "@/lib/audit";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  guestRole: z.enum(["ACTOR", "DIRECTOR", "CELEBRITY", "INFLUENCER", "SPECIAL_GUEST"]),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole("PRODUCER", "ADMIN");
    const { id } = await context.params;
    const premiere = await db.premiere.findUnique({
      where: { id },
      include: { movie: true },
    });
    if (!premiere) return Response.json({ error: "Premiere not found" }, { status: 404 });
    if (user.role !== "ADMIN" && premiere.producerId !== user.id) {
      return Response.json({ error: "Not your premiere" }, { status: 403 });
    }

    const body = schema.parse(await request.json());
    const invitation = await db.guestInvitation.create({
      data: {
        premiereId: id,
        name: body.name,
        email: body.email.toLowerCase(),
        guestRole: body.guestRole,
        token: crypto.randomUUID().replace(/-/g, ""),
      },
    });

    const guestUser = await db.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (guestUser) {
      await notifyUser({
        userId: guestUser.id,
        premiereId: id,
        type: "INVITE_SENT",
        title: "You're invited to a premiere",
        body: `Join ${premiere.movie.title} as ${body.guestRole.toLowerCase()}.`,
      });
    }

    await writeAudit({
      actorId: user.id,
      action: "guest.invited",
      target: invitation.id,
      meta: { premiereId: id, email: body.email },
    });

    return Response.json({
      invitation,
      inviteUrl: `/guest/invite/${invitation.token}`,
    });
  } catch (error) {
    return jsonError(error);
  }
}
