import { z } from "zod";
import { jsonError, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeAudit } from "@/lib/audit";

export async function GET() {
  try {
    await requireRole("ADMIN");
    const users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        suspended: true,
        createdAt: true,
        producerProfile: { select: { studioName: true } },
      },
    });
    return Response.json({ users });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireRole("ADMIN");
    const body = z
      .object({ userId: z.string(), suspended: z.boolean(), role: z.string().optional() })
      .parse(await request.json());
    const user = await db.user.update({
      where: { id: body.userId },
      data: {
        suspended: body.suspended,
        role: body.role,
      },
    });
    await writeAudit({
      actorId: admin.id,
      action: body.suspended ? "user.suspended" : "user.updated",
      target: user.id,
    });
    return Response.json({ user });
  } catch (error) {
    return jsonError(error);
  }
}
