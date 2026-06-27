import { headers } from "next/headers";

export function getBaseUrl() {
  const headerList = headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  const vercelUrl = process.env.VERCEL_URL;

  if (host) {
    return `${proto}://${host}`;
  }

  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }

  return "http://localhost:3000";
}
