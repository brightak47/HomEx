import { z } from "zod";
import { createSession, hashPassword, jsonError } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(["VIEWER", "PRODUCER"]).default("VIEWER"),
  studioName: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const limited = rateLimit(`register:${request.headers.get("x-forwarded-for") ?? "local"}`, 8);
    if (!limited.ok) return Response.json({ error: "Too many signups" }, { status: 429 });

    const body = schema.parse(await request.json());
    const email = body.email.toLowerCase();
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return Response.json({ error: "An account already exists" }, { status: 409 });

    const user = await db.user.create({
      data: {
        email,
        passwordHash: await hashPassword(body.password),
        name: body.name,
        role: body.role,
        producerProfile:
          body.role === "PRODUCER"
            ? { create: { studioName: body.studioName || `${body.name} Studio` } }
            : undefined,
      },
    });

    await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "VIEWER" | "PRODUCER",
    });

    return Response.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (error) {
    return jsonError(error);
  }
}
