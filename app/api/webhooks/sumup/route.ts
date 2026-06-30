import { VAT_RATE, roundMoney } from "@/lib/money";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PosConnection, Tag } from "@/lib/types";
import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

type SumupWebhookPayload = {
  event_type?: string;
  payload?: {
    id?: string;
    status?: string;
    amount?: number;
    timestamp?: string;
    merchant_code?: string;
    checkout_reference?: string;
  };
};

function verifySignature(body: string, signatureHeader: string | null) {
  const secret = process.env.SUMUP_WEBHOOK_SECRET;
  if (!secret) return false;
  if (!signatureHeader) return false;

  const digest = createHmac("sha256", secret).update(body).digest("hex");
  const provided = signatureHeader.replace(/^sha256=/, "");
  const digestBuffer = Buffer.from(digest);
  const providedBuffer = Buffer.from(provided);
  if (digestBuffer.length !== providedBuffer.length) return false;
  return timingSafeEqual(digestBuffer, providedBuffer);
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature =
    request.headers.get("x-sumup-signature") ??
    request.headers.get("sumup-signature");

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: SumupWebhookPayload;
  try {
    body = JSON.parse(rawBody) as SumupWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const eventType = body.event_type?.toLowerCase() ?? "";
  const payload = body.payload;
  const isCompleted =
    eventType.includes("transaction") &&
    (payload?.status?.toLowerCase() === "successful" ||
      payload?.status?.toLowerCase() === "completed");

  if (!isCompleted || !payload?.merchant_code || !payload.checkout_reference) {
    return NextResponse.json({ ok: true });
  }

  const supabase = createAdminClient();
  const { data: connection } = await supabase
    .from("pos_connections")
    .select("*")
    .eq("provider", "sumup")
    .eq("external_merchant_id", payload.merchant_code)
    .maybeSingle<PosConnection>();

  if (!connection) {
    return NextResponse.json({ ok: true });
  }

  const { data: tag } = await supabase
    .from("tags")
    .select("*")
    .eq("merchant_id", connection.merchant_id)
    .ilike("tag_code", payload.checkout_reference.trim())
    .maybeSingle<Tag>();

  if (!tag) {
    return NextResponse.json({ ok: true });
  }

  const total = roundMoney(Number(payload.amount ?? 0));
  if (total <= 0) {
    return NextResponse.json({ ok: true });
  }
  const subtotal = roundMoney(total / (1 + VAT_RATE));
  const vat = roundMoney(total - subtotal);

  await supabase.from("receipts").insert({
    merchant_id: connection.merchant_id,
    tag_id: tag.id,
    items: [],
    subtotal,
    vat,
    total,
    payment_method: "Card",
    awaiting_items: true,
    is_latest: false,
    created_at: payload.timestamp ?? new Date().toISOString()
  });

  return NextResponse.json({ ok: true });
}
