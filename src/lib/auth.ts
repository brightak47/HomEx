import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { db } from "./db";

const COOKIE = "homex_session";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "VIEWER" | "PRODUCER" | "CELEBRITY" | "ADMIN";
  imageUrl?: string | null;
};

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not configured");
  return new TextEncoder().encode(value);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(secret());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret());
    const user = await db.user.findUnique({
      where: { id: String(payload.sub) },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        imageUrl: true,
        suspended: true,
      },
    });
    if (!user || user.suspended) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as SessionUser["role"],
      imageUrl: user.imageUrl,
    };
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getSession();
  if (!user) {
    const error = new Error("Authentication required");
    (error as Error & { status: number }).status = 401;
    throw error;
  }
  return user;
}

export async function requireRole(...roles: SessionUser["role"][]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    const error = new Error("Not authorized for this action");
    (error as Error & { status: number }).status = 403;
    throw error;
  }
  return user;
}

export function jsonError(error: unknown, fallback = 400) {
  const status =
    typeof error === "object" && error && "status" in error
      ? Number((error as { status: number }).status)
      : fallback;
  const message = error instanceof Error ? error.message : "Request failed";
  return Response.json({ error: message }, { status });
}
