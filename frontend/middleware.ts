import { NextResponse, type NextRequest } from "next/server";

const ROLE_COOKIE = "qrfood_role";
const ACCESS_TOKEN_COOKIE = "qrfood_access_token";

function redirectTo(request: NextRequest, pathname: string) {
  return NextResponse.redirect(new URL(pathname, request.url));
}

function getAuthRole(request: NextRequest) {
  const role = request.cookies.get(ROLE_COOKIE)?.value;
  return role === "ADMIN" || role === "STAFF" ? role : null;
}

function hasAuth(request: NextRequest) {
  return Boolean(request.cookies.get(ACCESS_TOKEN_COOKIE)?.value && getAuthRole(request));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = getAuthRole(request);
  const authenticated = hasAuth(request);

  if (pathname === "/login" && authenticated) {
    return redirectTo(request, role === "ADMIN" ? "/admin" : "/staff/orders");
  }

  if (pathname.startsWith("/admin")) {
    if (!authenticated) {
      return redirectTo(request, "/login");
    }

    if (role !== "ADMIN") {
      return redirectTo(request, "/staff/orders");
    }
  }

  if (pathname.startsWith("/staff") && !authenticated) {
    return redirectTo(request, "/login");
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/admin/:path*", "/staff/:path*"],
};
