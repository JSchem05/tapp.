import { createServerClient, type CookieOptions } from "@supabase/ssr";
import {
  clearDeviceSessionCookie,
  DEVICE_COOKIE,
  getDeviceSessionFromRequest,
  parseDeviceSession
} from "@/lib/device-session";
import { getSupabaseKey, getSupabaseUrl } from "@/lib/supabase/env";
import { NextResponse, type NextRequest } from "next/server";

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
    return NextResponse.redirect(new URL("/device", request.url));
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

  const deviceSession =
    getDeviceSessionFromRequest(request) ??
    parseDeviceSession(request.cookies.get(DEVICE_COOKIE)?.value);

  const isOwner = Boolean(user) || hasSupabaseAuthCookie || deviceSession?.role === "owner";
  const isStaff = deviceSession?.role === "staff" && !user && !hasSupabaseAuthCookie;

  if (!isOwner && !isStaff) {
    if (isOwnerRoute(pathname) || isStaffRoute(pathname)) {
      return NextResponse.redirect(new URL("/device", request.url));
    }
    return response;
  }

  if (isStaff && isOwnerRoute(pathname)) {
    return NextResponse.redirect(new URL("/staff", request.url));
  }

  if (isOwner && isStaffRoute(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
