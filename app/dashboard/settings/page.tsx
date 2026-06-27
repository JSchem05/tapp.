import { updateMerchantSettings } from "@/app/dashboard/actions";
import { CopyButton } from "@/components/copy-button";
import { Card, Input, Label } from "@/components/ui";
import { getAuthedMerchant } from "@/lib/auth";
import type { Tag } from "@/lib/types";
import { Cable, Save, Wifi } from "lucide-react";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams
}: {
  searchParams?: { saved?: string; error?: string };
}) {
  const { supabase, merchant } = await getAuthedMerchant();
  const { data: tags } = await supabase
    .from("tags")
    .select("*")
    .eq("merchant_id", merchant.id)
    .order("created_at", { ascending: true })
    .returns<Tag[]>();

  const baseUrl = getBaseUrl();

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
      <Card className="h-fit">
        <h1 className="text-2xl font-bold text-ink">Merchant settings</h1>
        <p className="mt-1 text-sm text-coffee/65">
          Keep the business name on customer receipts up to date.
        </p>

        <form action={updateMerchantSettings} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label>Business name</Label>
            <Input name="name" defaultValue={merchant.name} required />
          </div>

          {searchParams?.error ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {searchParams.error}
            </p>
          ) : null}
          {searchParams?.saved ? (
            <p className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-700">
              Settings saved.
            </p>
          ) : null}

          <button className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-coffee px-4 text-sm font-semibold text-paper transition hover:bg-ink">
            <Save className="h-4 w-4" />
            Save changes
          </button>
        </form>
      </Card>

      <div className="space-y-5">
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cream text-coffee">
              <Wifi className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-ink">NFC tag URLs</h2>
              <p className="text-sm text-coffee/65">
                Program each puck with its permanent URL.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {(tags ?? []).map((tag) => {
              const url = `${baseUrl}/t/${tag.tag_code}`;
              return (
                <div
                  key={tag.id}
                  className="rounded-2xl border border-coffee/10 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-ink">{tag.label}</p>
                      <p className="mt-1 text-sm text-coffee/60">{tag.tag_code}</p>
                    </div>
                    <CopyButton value={url} />
                  </div>
                  <p className="mt-3 break-all rounded-xl bg-cream px-3 py-2 text-sm text-coffee/75">
                    {url}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="border-dashed">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cream text-coffee">
              <Cable className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-ink">POS integration</h2>
              <p className="text-sm text-coffee/65">
                Connectors for POS systems can be added here later.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function getBaseUrl() {
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
