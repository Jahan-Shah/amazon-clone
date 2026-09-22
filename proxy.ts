import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
];

export function proxy(request: NextRequest) {
  const hasSession = SESSION_COOKIES.some((name) =>
    request.cookies.has(name),
  );
  if (hasSession) return NextResponse.next();

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set(
    "callbackURL",
    request.nextUrl.pathname + request.nextUrl.search,
  );
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/checkout", "/orders/:path*"],
};
