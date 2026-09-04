import { db } from "./db";

export async function writeAudit(input: {
  actorId?: string | null;
  action: string;
  target?: string;
  meta?: Record<string, unknown>;
}) {
  await db.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action,
      target: input.target,
      meta: input.meta ? JSON.stringify(input.meta) : null,
    },
  });
}
