import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "better-auth.session_token";

const PROTECTED_PREFIXES = ["/dashboard", "/chat", "/settings"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const hasSessionCookie = request.cookies.has(SESSION_COOKIE);
  if (!hasSessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // NOTE: cookie presence is only a UX gate. Real authentication and
  // authorization are re-verified server-side on every protected resource.
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/chat/:path*", "/settings/:path*"],
};