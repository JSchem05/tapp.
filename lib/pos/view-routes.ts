export function ownerAppPath(
  view: import("@/lib/pos/app-data").PosView = "dashboard",
  query?: Record<string, string>
) {
  const params = new URLSearchParams();
  const hasQuery = Object.keys(query ?? {}).length > 0;
  if (view !== "dashboard" || hasQuery) params.set("view", view);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value) params.set(key, value);
  }
  const suffix = params.toString();
  return suffix ? `/pos?${suffix}` : "/pos";
}

export function staffAppPath(
  view: import("@/lib/pos/app-data").PosView = "pos",
  query?: Record<string, string>
) {
  const params = new URLSearchParams();
  if (view !== "pos") params.set("view", view);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value) params.set(key, value);
  }
  const suffix = params.toString();
  return suffix ? `/staff?${suffix}` : "/staff";
}

export function menuBuilderPath(staff: { id: string } | null, suffix = "") {
  const base = staff ? "/staff" : "/pos";
  const params = new URLSearchParams({ view: "menu" });
  if (suffix) {
    const normalized = suffix.startsWith("?") ? suffix.slice(1) : suffix;
    for (const part of normalized.split("&")) {
      const [key, value] = part.split("=");
      if (key) params.set(key, value ?? "");
    }
  }
  return `${base}?${params.toString()}`;
}

export function legacyDashboardRedirect(pathname: string, search: string) {
  const query = search.startsWith("?") ? search.slice(1) : search;
  const suffix = query ? `&${query}` : "";

  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    return `/pos?view=dashboard${suffix}`;
  }
  if (pathname === "/dashboard/receipts") return "/pos?view=receipts";
  if (pathname === "/dashboard/settings") {
    return query ? `/pos?view=settings&${query}` : "/pos?view=settings";
  }
  if (pathname.startsWith("/dashboard/receipt/")) return null;
  if (pathname.startsWith("/dashboard/")) return "/pos?view=dashboard";
  return null;
}

export function legacyPosMenuRedirect(pathname: string, search: string) {
  if (!pathname.startsWith("/pos/menu")) return null;
  const query = search.startsWith("?") ? search.slice(1) : search;
  return query ? `/pos?view=menu&${query}` : "/pos?view=menu";
}

export function legacyStaffRouteRedirect(pathname: string, search: string) {
  const query = search.startsWith("?") ? search.slice(1) : search;
  const suffix = query ? `&${query}` : "";
  if (pathname === "/staff/menu" || pathname.startsWith("/staff/menu/")) {
    return `/staff?view=menu${suffix}`;
  }
  if (pathname === "/staff/receipts") return "/staff?view=receipts";
  return null;
}
