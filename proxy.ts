import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const sessionToken = request.cookies.get("pos_session")?.value;
  const pathname = request.nextUrl.pathname;

  // Proteksi rute operasional kasir /pos
  if (pathname.startsWith("/pos")) {
    if (!sessionToken) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Jika sudah memiliki cookie sesi dan mengakses halaman /login, arahkan ke terminal POS
  if (pathname === "/login") {
    if (sessionToken) {
      const posUrl = new URL("/pos", request.url);
      return NextResponse.redirect(posUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/pos/:path*",
    "/login",
  ],
};
