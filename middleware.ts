import { createServerClient, type CookieOptions } from "@supabase/ssr";
import {
  DEVICE_COOKIE,
  getStaffDeviceSessionFromRequest,
  parseStaffDeviceSession
} from "@/lib/device-session";
import {
  legacyDashboardRedirect,
  legacyPosMenuRedirect,
  legacyStaffRouteRedirect
} from "@/lib/pos/view-routes";
import { getSupabaseKey, getSupabaseUrl } from "@/lib/supabase/env";
import { NextResponse, type NextRequest } from "next/server";

const STAFF_RESTRICTED_VIEWS = new Set(["dashboard", "settings"]);

const PUBLIC_PREFIXES = ["/t/", "/r/", "/api/"];
const PUBLIC_EXACT = new Set(["/device", "/login"]);

function isPublicRoute(pathname: string) {
  if (PUBLIC_EXACT.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isStaffRoute(pathname: string) {
  return pathname === "/staff" || pathname.startsWith("/staff/");
}

function isOwnerRoute(pathname: string) {
  return (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/pos" ||
    pathname.startsWith("/pos/")
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !getSupabaseKey()) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const hasSupabaseAuthCookie = request.cookies
    .getAll()
    .some(
      (cookie) =>
        cookie.name.includes("sb-") &&
        (cookie.name.includes("auth-token") || cookie.name.includes("access-token"))
    );

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: {
          name: string;
          value: string;
          options: CookieOptions;
        }[]
      ) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      }
    }
  });

  let user: unknown = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    user = null;
  }

  const staffSession =
    getStaffDeviceSessionFromRequest(request) ??
    parseStaffDeviceSession(request.cookies.get(DEVICE_COOKIE)?.value);

  const isOwner = Boolean(user) || hasSupabaseAuthCookie;
  const isStaff = Boolean(staffSession) && !isOwner;

  if (!isOwner && !isStaff) {
    if (isOwnerRoute(pathname) || isStaffRoute(pathname)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return response;
  }

  if (isStaff && isOwnerRoute(pathname)) {
    return NextResponse.redirect(new URL("/staff", request.url));
  }

  if (isOwner && isStaffRoute(pathname)) {
    return NextResponse.redirect(new URL("/pos", request.url));
  }

  if (isStaff && isStaffRoute(pathname)) {
    const view = request.nextUrl.searchParams.get("view");
    if (view && STAFF_RESTRICTED_VIEWS.has(view)) {
      return NextResponse.redirect(new URL("/staff", request.url));
    }
  }

  if (isOwner) {
    const legacyTarget =
      legacyDashboardRedirect(pathname, request.nextUrl.search) ??
      legacyPosMenuRedirect(pathname, request.nextUrl.search);
    if (legacyTarget) {
      return NextResponse.redirect(new URL(legacyTarget, request.url));
    }
  }

  if (isStaff) {
    const legacyTarget = legacyStaffRouteRedirect(pathname, request.nextUrl.search);
    if (legacyTarget) {
      return NextResponse.redirect(new URL(legacyTarget, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
