import { redirect } from "next/navigation";

export default function StaffMenuPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const params = new URLSearchParams({ view: "menu" });
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (!value) continue;
    params.set(key, Array.isArray(value) ? value[0] : value);
  }
  redirect(`/staff?${params.toString()}`);
}
