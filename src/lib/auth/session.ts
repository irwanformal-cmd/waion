import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { auth, type SessionUser } from "@/lib/auth";
import { ApiError } from "@/lib/api/error";

export const getSession = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
});

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