import { z } from "zod";
import { createSession, jsonError, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const limited = rateLimit(`login:${request.headers.get("x-forwarded-for") ?? "local"}`, 12);
    if (!limited.ok) return Response.json({ error: "Too many login attempts" }, { status: 429 });

    const body = schema.parse(await request.json());
    const user = await db.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (!user || user.suspended || !(await verifyPassword(body.password, user.passwordHash))) {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "VIEWER" | "PRODUCER" | "CELEBRITY" | "ADMIN",
      imageUrl: user.imageUrl,
    });

    return Response.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (error) {
    return jsonError(error);
  }
}
