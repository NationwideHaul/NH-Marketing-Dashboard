import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Guards every route in the app. Anything not listed as public requires an
// authenticated session — unauthenticated visitors are bounced to /login.
export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Public paths:
  //   /login                — the sign-in page itself
  //   /api/auth/*           — NextAuth's own endpoints (sign-in callback, etc.)
  //   /api/cron/*           — Vercel Cron + CRON_SECRET have their own auth
  //   /api/connect-google   — Google OAuth re-consent handoff (browser redirect)
  //   /api/connect-youtube  — same, for the YouTube brand-account flow
  const isPublic =
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/api/connect-google") ||
    pathname.startsWith("/api/connect-youtube");

  if (isPublic) return NextResponse.next();

  if (!req.auth) {
    // For API calls return 401 JSON so clients don't follow an HTML redirect.
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  // Skip Next internals and static files; everything else goes through auth.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico)$).*)"],
};
