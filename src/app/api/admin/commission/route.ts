import { z } from "zod";
import { jsonError, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { getSettings } from "@/lib/premieres";

const schema = z.object({
  commissionType: z.enum(["PERCENTAGE", "FIXED"]),
  percentageBps: z.number().int().min(0).max(10_000),
  fixedFeeCents: z.number().int().min(0),
  minFeeCents: z.number().int().min(0),
  maxConcurrentStreams: z.number().int().min(1).max(5),
  terminatePriorSession: z.boolean(),
});

export async function GET() {
  try {
    await requireRole("ADMIN");
    return Response.json({ settings: await getSettings() });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole("ADMIN");
    const body = schema.parse(await request.json());
    const settings = await db.platformSettings.update({
      where: { id: "global" },
      data: body,
    });
    await writeAudit({
      actorId: user.id,
      action: "settings.commission",
      target: "global",
      meta: body,
    });
    return Response.json({ settings });
  } catch (error) {
    return jsonError(error);
  }
}
