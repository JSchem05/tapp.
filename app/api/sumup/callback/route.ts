import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type SumupTokenResponse = {
  access_token: string;
  refresh_token?: string;
  merchant_code?: string;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const encodedState = url.searchParams.get("state");
  const clientId = process.env.SUMUP_CLIENT_ID;
  const clientSecret = process.env.SUMUP_CLIENT_SECRET;
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  if (!code || !encodedState || !clientId || !clientSecret) {
    return NextResponse.redirect(`${appUrl}/dashboard/settings?error=Missing%20SumUp%20OAuth%20data`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // callback reads session only
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${appUrl}/login`);
  }

  let merchantIdFromState = "";
  try {
    const decoded = JSON.parse(
      Buffer.from(encodedState, "base64url").toString("utf8")
    ) as { merchantId?: string };
    merchantIdFromState = decoded.merchantId ?? "";
  } catch {
    return NextResponse.redirect(`${appUrl}/dashboard/settings?error=Invalid%20SumUp%20state`);
  }

  if (merchantIdFromState !== user.id) {
    return NextResponse.redirect(`${appUrl}/dashboard/settings?error=SumUp%20state%20mismatch`);
  }

  const tokenRes = await fetch("https://api.sumup.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: `${appUrl}/api/sumup/callback`
    })
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${appUrl}/dashboard/settings?error=SumUp%20token%20exchange%20failed`);
  }

  const token = (await tokenRes.json()) as SumupTokenResponse;
  const { data: existing } = await supabase
    .from("pos_connections")
    .select("id")
    .eq("merchant_id", user.id)
    .eq("provider", "sumup")
    .maybeSingle<{ id: string }>();

  if (existing?.id) {
    await supabase
      .from("pos_connections")
      .update({
        access_token: token.access_token,
        refresh_token: token.refresh_token ?? null,
        external_merchant_id: token.merchant_code ?? null
      })
      .eq("id", existing.id)
      .eq("merchant_id", user.id);
  } else {
    await supabase.from("pos_connections").insert({
      merchant_id: user.id,
      provider: "sumup",
      access_token: token.access_token,
      refresh_token: token.refresh_token ?? null,
      external_merchant_id: token.merchant_code ?? null
    });
  }

  return NextResponse.redirect(`${appUrl}/dashboard/settings?saved=1`);
}
