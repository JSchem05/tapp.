import { redirect } from "next/navigation";

export default function DashboardSettingsPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const params = new URLSearchParams({ view: "settings" });
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (!value) continue;
    params.set(key, Array.isArray(value) ? value[0] : value);
  }
  redirect(`/pos?${params.toString()}`);
}
