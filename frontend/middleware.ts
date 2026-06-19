import { NextResponse, type NextRequest } from "next/server";
import { isJwtExpired } from "@/shared/auth/jwt";

const ROLE_COOKIE = "qrfood_role";
const ACCESS_TOKEN_COOKIE = "qrfood_access_token";
const REFRESH_TOKEN_COOKIE = "qrfood_refresh_token";

function redirectTo(request: NextRequest, pathname: string) {
  return NextResponse.redirect(new URL(pathname, request.url));
}

function redirectToLoginAndClearAuth(request: NextRequest) {
  const response = redirectTo(request, "/login");
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(REFRESH_TOKEN_COOKIE);
  response.cookies.delete(ROLE_COOKIE);
  return response;
}

function getAuthRole(request: NextRequest) {
  const role = request.cookies.get(ROLE_COOKIE)?.value;
  return role === "ADMIN" || role === "STAFF" ? role : null;
}

function hasAuth(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  return Boolean(
    accessToken &&
      refreshToken &&
      !isJwtExpired(refreshToken) &&
      getAuthRole(request),
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = getAuthRole(request);
  const authenticated = hasAuth(request);

  if (pathname === "/" && authenticated) {
    return redirectTo(request, role === "ADMIN" ? "/admin" : "/staff/orders");
  }

  if (pathname === "/login" && authenticated) {
    return redirectTo(request, role === "ADMIN" ? "/admin" : "/staff/orders");
  }

  if (pathname.startsWith("/admin")) {
    if (!authenticated) {
      return redirectToLoginAndClearAuth(request);
    }

    if (role !== "ADMIN") {
      return redirectTo(request, "/staff/orders");
    }
  }

  if (pathname.startsWith("/staff") && !authenticated) {
    return redirectToLoginAndClearAuth(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/admin/:path*", "/staff/:path*"],
};
