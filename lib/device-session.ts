import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

export const DEVICE_COOKIE = "tapp_staff_device";

export type StaffDeviceSession = {
  staffId: string;
  staffName: string;
  merchantId: string;
};

export function encodeStaffDeviceSession(session: StaffDeviceSession) {
  return JSON.stringify(session);
}

export function parseStaffDeviceSession(
  value: string | undefined | null
): StaffDeviceSession | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as StaffDeviceSession;
    if (!parsed.staffId || !parsed.staffName || !parsed.merchantId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getStaffDeviceSessionFromRequest(request: NextRequest) {
  return parseStaffDeviceSession(request.cookies.get(DEVICE_COOKIE)?.value);
}

export function setStaffDeviceSessionCookie(
  response: NextResponse,
  session: StaffDeviceSession
) {
  response.cookies.set(DEVICE_COOKIE, encodeStaffDeviceSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365
  });
}

export function clearStaffDeviceSessionCookie(response: NextResponse) {
  response.cookies.set(DEVICE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

export async function getStaffDeviceSessionFromCookies() {
  const cookieStore = await cookies();
  return parseStaffDeviceSession(cookieStore.get(DEVICE_COOKIE)?.value);
}

export async function setStaffDeviceSession(session: StaffDeviceSession) {
  const cookieStore = await cookies();
  cookieStore.set(DEVICE_COOKIE, encodeStaffDeviceSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365
  });
}

export async function clearStaffDeviceSession() {
  const cookieStore = await cookies();
  cookieStore.set(DEVICE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}
