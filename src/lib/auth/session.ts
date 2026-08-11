import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { auth, type SessionUser } from "@/lib/auth";
import { ApiError } from "@/lib/api/error";
import type { SessionUserDto, UserRole, PlanName } from "@wai/shared";

export const getSession = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
});

/** Subset of the session user that is safe to pass to client components. */
export function userToDto(user: SessionUser): SessionUserDto {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    emailVerified: user.emailVerified,
    role: (user.role ?? "user") as UserRole,
    plan: (user.plan ?? "free") as PlanName,
    image: user.image ?? null,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new ApiError("UNAUTHENTICATED", 401);
  }
  return session.user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") {
    throw new ApiError("FORBIDDEN", 403);
  }
  return user;
}