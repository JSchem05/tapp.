import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

export const DEVICE_COOKIE = "tapp_staff_device";

export type StaffDeviceSession = {
  staffId: string;
  staffName: string;
  merchantId: string;
};

// Cookie format: base64url(JSON payload) + "." + base64url(HMAC-SHA256 signature).
// Signed so a client cannot forge staffId/merchantId. Web Crypto is used so this
// also runs in the Edge middleware runtime.

function getSecret(): string | null {
  return (
    process.env.DEVICE_SESSION_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    null
  );
}

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array | null {
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  } catch {
    return null;
  }
}

async function signPayload(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return toBase64Url(new Uint8Array(signature));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return mismatch === 0;
}

export async function encodeStaffDeviceSession(
  session: StaffDeviceSession
): Promise<string> {
  const secret = getSecret();
  const payload = toBase64Url(encoder.encode(JSON.stringify(session)));
  if (!secret) return payload;
  const signature = await signPayload(payload, secret);
  return `${payload}.${signature}`;
}

export async function parseStaffDeviceSession(
  value: string | undefined | null
): Promise<StaffDeviceSession | null> {
  if (!value) return null;
  const secret = getSecret();
  const [payload, signature] = value.split(".");
  if (!payload) return null;

  if (secret) {
    if (!signature) return null;
    const expected = await signPayload(payload, secret);
    if (!timingSafeEqual(signature, expected)) return null;
  }

  const bytes = fromBase64Url(payload);
  if (!bytes) return null;

  try {
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as StaffDeviceSession;
    if (!parsed.staffId || !parsed.staffName || !parsed.merchantId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function getStaffDeviceSessionFromRequest(request: NextRequest) {
  return parseStaffDeviceSession(request.cookies.get(DEVICE_COOKIE)?.value);
}

export async function setStaffDeviceSessionCookie(
  response: NextResponse,
  session: StaffDeviceSession
) {
  response.cookies.set(DEVICE_COOKIE, await encodeStaffDeviceSession(session), {
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
  cookieStore.set(DEVICE_COOKIE, await encodeStaffDeviceSession(session), {
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
