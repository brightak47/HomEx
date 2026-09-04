import { jsonError, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifyUser } from "@/lib/adapters/notifications";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const invitation = await db.guestInvitation.findUnique({
    where: { token },
    include: { premiere: { include: { movie: true } } },
  });
  if (!invitation) return Response.json({ error: "Invitation not found" }, { status: 404 });
  return Response.json({
    invitation: {
      id: invitation.id,
      name: invitation.name,
      email: invitation.email,
      guestRole: invitation.guestRole,
      status: invitation.status,
      title: invitation.premiere.movie.title,
      posterUrl: invitation.premiere.movie.posterUrl,
      premiereId: invitation.premiereId,
      scheduledAt: invitation.premiere.scheduledAt,
    },
  });
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  try {
    const user = await requireUser();
    const { token } = await context.params;
    const invitation = await db.guestInvitation.findUnique({
      where: { token },
      include: { premiere: { include: { movie: true } } },
    });
    if (!invitation) return Response.json({ error: "Invitation not found" }, { status: 404 });

    const celebrity = await db.celebrityProfile.upsert({
      where: { userId: user.id },
      update: { displayName: user.name },
      create: { userId: user.id, displayName: user.name },
    });

    if (user.role === "VIEWER") {
      await db.user.update({ where: { id: user.id }, data: { role: "CELEBRITY" } });
    }

    const updated = await db.guestInvitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED", celebrityProfileId: celebrity.id },
    });

    await notifyUser({
      userId: invitation.premiere.producerId,
      premiereId: invitation.premiereId,
      type: "GUEST_ANNOUNCEMENT",
      title: "Guest accepted",
      body: `${user.name} accepted the invitation to ${invitation.premiere.movie.title}.`,
    });

    return Response.json({ invitation: updated, premiereId: invitation.premiereId });
  } catch (error) {
    return jsonError(error);
  }
}
