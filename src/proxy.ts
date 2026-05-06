import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Marketing / public routes that do not require auth.
// Anything not listed here will be redirected to /login when no session.
const PUBLIC_PATHS = ["/login", "/api/login", "/register"];
const PUBLIC_EXACT = new Set(["/"]);

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = req.cookies.get("shop_session")?.value;

  // Allow public paths
  if (
    PUBLIC_EXACT.has(pathname) ||
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
  ) {
    if (pathname === "/login" && session) {
      return NextResponse.redirect(new URL("/pos", req.url));
    }
    return NextResponse.next();
  }

  // Allow assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (!session) {
    const url = new URL("/login", req.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
