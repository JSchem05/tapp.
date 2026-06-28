import { updateMerchantSettings } from "@/app/dashboard/actions";
import { CopyButton } from "@/components/copy-button";
import { LogoUploadField } from "@/components/logo-upload-field";
import { Card, Input, Label } from "@/components/ui";
import { getAuthedMerchant } from "@/lib/auth";
import type { Tag } from "@/lib/types";
import { getBaseUrl } from "@/lib/url";
import { AlertTriangle, Cable, Save, Store, Wifi } from "lucide-react";

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
    <div className="animate-tapp-fade mx-auto max-w-[600px] space-y-5">
      <div>
        <p className="text-sm font-semibold text-muted">Settings</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">
          Merchant profile
        </h1>
        <p className="mt-1 text-sm text-muted">
          Manage the details customers see on every receipt.
        </p>
      </div>

      <form action={updateMerchantSettings} className="space-y-5">
        <Card className="p-6">
          <SectionHeader
            icon={<Store className="h-5 w-5" />}
            title="Business Info"
            description="Your public name appears on tap and permalink receipts."
          />
          <div className="mt-5 space-y-2">
            <Label>Business name</Label>
            <Input name="name" defaultValue={merchant.name} required />
          </div>
          <SaveButton />
        </Card>

        <Card className="p-6">
          <SectionHeader
            icon={<Wifi className="h-5 w-5" />}
            title="Logo Upload"
            description="Add a mark that makes customer receipts feel branded."
          />
          <div className="mt-5">
            <LogoUploadField
              currentLogoUrl={merchant.logo_url}
              merchantName={merchant.name}
            />
          </div>
          <SaveButton />
        </Card>

        {searchParams?.error ? (
          <p className="rounded-[10px] bg-red-50 px-3 py-2 text-sm text-red-700">
            {searchParams.error}
          </p>
        ) : null}
        {searchParams?.saved ? (
          <p className="rounded-[10px] bg-green-50 px-3 py-2 text-sm text-green-700">
            Settings saved.
          </p>
        ) : null}
      </form>

      <Card className="p-6">
        <SectionHeader
          icon={<Wifi className="h-5 w-5" />}
          title="NFC Tags"
          description="Permanent URLs for each counter puck."
        />
        <div className="mt-5 space-y-3">
          {(tags ?? []).map((tag) => {
            const url = `${baseUrl}/t/${tag.tag_code}`;
            return (
              <div
                key={tag.id}
                className="rounded-[18px] border border-line bg-white/60 p-4 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:shadow-soft"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-extrabold text-ink">{tag.label}</p>
                    <p className="mt-1 text-sm text-muted">{tag.tag_code}</p>
                  </div>
                  <CopyButton value={url} />
                </div>
                <p className="mt-3 break-all rounded-[14px] border border-line bg-white/45 px-3 py-2 text-sm text-muted">
                  {url}
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="border-dashed bg-white/70 p-6 opacity-80">
        <SectionHeader
          icon={<Cable className="h-5 w-5" />}
          title="Connections"
          description="POS integrations are coming soon."
        />
      </Card>

      <Card className="border-red-100 bg-red-50/70 p-6">
        <SectionHeader
          icon={<AlertTriangle className="h-5 w-5" />}
          title="Danger Zone"
          description="Delete account controls will be enabled once billing and exports are ready."
          tone="danger"
        />
        <button
          type="button"
          disabled
          className="mt-5 rounded-[10px] border border-red-200 bg-white px-4 py-2 text-sm font-extrabold text-red-700 opacity-60"
        >
          Delete account
        </button>
      </Card>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  description,
  tone = "default"
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  tone?: "default" | "danger";
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          tone === "danger" ? "bg-red-100 text-red-700" : "bg-[#EEF1FF] text-amber"
        }`}
      >
        {icon}
      </div>
      <div>
        <h2 className="text-xl font-extrabold text-ink">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
      </div>
    </div>
  );
}

function SaveButton() {
  return (
    <button className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-[12px] bg-amber px-4 text-sm font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-clay hover:shadow-lift">
      <Save className="h-4 w-4" />
      Save section
    </button>
  );
}
