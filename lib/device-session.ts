import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

export const DEVICE_COOKIE = "tapp_device";
export type DeviceRole = "owner" | "staff";

export type DeviceSession = {
  merchantId: string;
  role: DeviceRole;
};

export function encodeDeviceSession(session: DeviceSession) {
  return `${session.role}:${session.merchantId}`;
}

export function parseDeviceSession(value: string | undefined | null): DeviceSession | null {
  if (!value) return null;
  const [role, merchantId] = value.split(":");
  if ((role !== "owner" && role !== "staff") || !merchantId) return null;
  return { merchantId, role };
}

export function getDeviceSessionFromRequest(request: NextRequest) {
  return parseDeviceSession(request.cookies.get(DEVICE_COOKIE)?.value);
}

export function setDeviceSessionCookie(response: NextResponse, session: DeviceSession) {
  response.cookies.set(DEVICE_COOKIE, encodeDeviceSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365
  });
}

export function clearDeviceSessionCookie(response: NextResponse) {
  response.cookies.set(DEVICE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

export async function getDeviceSessionFromCookies() {
  const cookieStore = await cookies();
  return parseDeviceSession(cookieStore.get(DEVICE_COOKIE)?.value);
}

export async function setDeviceSession(session: DeviceSession) {
  const cookieStore = await cookies();
  cookieStore.set(DEVICE_COOKIE, encodeDeviceSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365
  });
}

export async function clearDeviceSession() {
  const cookieStore = await cookies();
  cookieStore.set(DEVICE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}
