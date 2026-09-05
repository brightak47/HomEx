import { z } from "zod";
import { createSession, jsonError, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeAudit } from "@/lib/audit";

const schema = z.object({
  studioName: z.string().min(2).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await request.json().catch(() => ({})));
    const studioName = body.studioName || `${user.name} Studio`;

    await db.user.update({
      where: { id: user.id },
      data: {
        role: user.role === "ADMIN" ? user.role : "PRODUCER",
        producerProfile: {
          upsert: {
            update: { studioName },
            create: { studioName },
          },
        },
      },
    });

    if (user.role !== "ADMIN") {
      await createSession({
        ...user,
        role: "PRODUCER",
      });
    }

    await writeAudit({
      actorId: user.id,
      action: "user.became_producer",
      target: user.id,
    });

    return Response.json({ ok: true, role: user.role === "ADMIN" ? "ADMIN" : "PRODUCER" });
  } catch (error) {
    return jsonError(error);
  }
}
