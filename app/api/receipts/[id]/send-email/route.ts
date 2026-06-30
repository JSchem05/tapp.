import { buildReceiptEmailHtml } from "@/lib/receipt-email";
import { resolveMerchantIdForReceiptApi } from "@/lib/receipt-access";
import { getResend } from "@/lib/resend";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Receipt } from "@/lib/types";
import { NextResponse } from "next/server";

// Use onboarding@resend.dev until a custom domain is verified in Resend.
const DEFAULT_FROM = "Tapp <onboarding@resend.dev>";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const merchantId = await resolveMerchantIdForReceiptApi();
  if (!merchantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { email?: string };
  try {
    body = (await request.json()) as { email?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = String(body.email ?? "").trim();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "Email sending is not configured. Add RESEND_API_KEY." },
      { status: 503 }
    );
  }

  const resend = getResend();
  if (!resend) {
    return NextResponse.json(
      { error: "Email sending is not configured. Add RESEND_API_KEY." },
      { status: 503 }
    );
  }

  const admin = createAdminClient();
  const { data: receipt } = await admin
    .from("receipts")
    .select("*")
    .eq("id", params.id)
    .eq("merchant_id", merchantId)
    .maybeSingle<Receipt>();

  if (!receipt) {
    return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
  }

  const { data: merchant } = await admin
    .from("merchants")
    .select("name")
    .eq("id", merchantId)
    .single<{ name: string }>();

  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const receiptUrl = `${appUrl}/r/${receipt.id}`;

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? DEFAULT_FROM,
    to: email,
    subject: `Your receipt from ${merchant.name}`,
    html: buildReceiptEmailHtml({
      merchantName: merchant.name,
      receipt,
      receiptUrl
    })
  });

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "Failed to send email" },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
