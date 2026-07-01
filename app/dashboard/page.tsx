import { redirect } from "next/navigation";

export default function DashboardPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const params = new URLSearchParams();
  params.set("view", "dashboard");
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (key === "view" || !value) continue;
    params.set(key, Array.isArray(value) ? value[0] : value);
  }
  redirect(`/pos?${params.toString()}`);
}
