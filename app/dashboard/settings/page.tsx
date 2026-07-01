import {
  addStaffMember,
  connectSumUp,
  updateMerchantSettings
} from "@/app/dashboard/actions";
import { CopyButton } from "@/components/copy-button";
import { DesignReceiptEditor } from "@/components/design-receipt-editor";
import { LogoUploadField } from "@/components/logo-upload-field";
import { StaffList } from "@/components/staff-list";
import { Card, Input } from "@/components/ui";
import { getOwnerContext } from "@/lib/merchant-context";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PosConnection, Staff, Tag } from "@/lib/types";
import { getBaseUrl } from "@/lib/url";
import { Cable, Save, Store, Wifi } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams
}: {
  searchParams?: { saved?: string; error?: string };
}) {
  const { supabase, merchant } = await getOwnerContext();
  const admin = createAdminClient();
  const { data: tags } = await supabase
    .from("tags")
    .select("*")
    .eq("merchant_id", merchant.id)
    .order("created_at", { ascending: true })
    .returns<Tag[]>();
  const { data: staff } = await admin
    .from("staff")
    .select("id, name, code, merchant_id, created_at")
    .eq("merchant_id", merchant.id)
    .order("created_at", { ascending: true })
    .returns<Staff[]>();
  const { data: sumupConnection } = await supabase
    .from("pos_connections")
    .select("*")
    .eq("merchant_id", merchant.id)
    .eq("provider", "sumup")
    .maybeSingle<PosConnection>();

  const baseUrl = getBaseUrl();

  return (
    <div className="animate-tapp-fade mx-auto max-w-[1100px] space-y-5">
      <div>
        <p className="text-sm font-semibold text-muted">Settings</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">
          Merchant profile
        </h1>
        <p className="mt-1 text-sm text-muted">
          Manage the details customers see on every receipt.
        </p>
      </div>

      <form action={updateMerchantSettings} className="space-y-5">
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

        <DesignReceiptEditor merchant={merchant} />

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
          icon={<Store className="h-5 w-5" />}
          title="Staff"
          description="Each staff member gets a personal code to sign in on a shared device."
        />
        <form action={addStaffMember} className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
          <Input name="name" placeholder="Staff name" required />
          <button className="h-11 rounded-[10px] bg-ink px-4 text-sm font-semibold text-white shadow-soft">
            Add staff
          </button>
        </form>
        <div className="mt-4">
          <StaffList staff={staff ?? []} />
        </div>
      </Card>

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
                className="rounded-[16px] border border-line bg-white p-4 shadow-sm transition hover:bg-blueSoft hover:shadow-soft"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-ink">{tag.label}</p>
                    <p className="mt-1 text-sm text-muted">{tag.tag_code}</p>
                  </div>
                  <CopyButton value={url} />
                </div>
                <p className="mt-3 break-all rounded-[10px] border border-line bg-blueSoft px-3 py-2 text-sm text-muted">
                  {url}
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-6">
        <SectionHeader
          icon={<Cable className="h-5 w-5" />}
          title="Integrations"
          description="Connect SumUp to receive card transactions as awaiting-item receipts."
        />
        <div className="mt-5 flex items-center justify-between rounded-[14px] border border-line bg-white px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-ink">SumUp</p>
            <p className="text-xs text-muted">
              {sumupConnection ? "Connected" : "Not connected"}
            </p>
          </div>
          <form action={connectSumUp}>
            <button className="h-10 rounded-[10px] bg-ink px-4 text-sm font-semibold text-white shadow-soft">
              {sumupConnection ? "Reconnect SumUp" : "Connect SumUp"}
            </button>
          </form>
        </div>
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
          tone === "danger" ? "bg-red-100 text-red-700" : "bg-blueSoft text-amber"
        }`}
      >
        {icon}
      </div>
      <div>
        <h2 className="text-xl font-semibold text-ink">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
      </div>
    </div>
  );
}

function SaveButton({ label = "Save section" }: { label?: string }) {
  return (
    <button className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-amber px-4 text-sm font-semibold text-white shadow-soft transition hover:bg-clay hover:shadow-lift">
      <Save className="h-4 w-4" />
      {label}
    </button>
  );
}
