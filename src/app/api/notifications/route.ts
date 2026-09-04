import { jsonError, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await requireUser();
    const notifications = await db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    return Response.json({ notifications });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST() {
  try {
    const user = await requireUser();
    await db.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });
    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
