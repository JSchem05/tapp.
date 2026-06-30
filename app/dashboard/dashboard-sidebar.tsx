import { logout } from "@/app/dashboard/actions";
import {
  BarChart3,
  Grid3X3,
  Home,
  LogOut,
  MenuSquare,
  ReceiptText,
  Settings
} from "lucide-react";
import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home, exact: true },
  { href: "/pos", label: "POS", icon: Grid3X3, exact: true },
  { href: "/pos/menu", label: "Menu", icon: MenuSquare },
  { href: "/dashboard/receipts", label: "Receipts", icon: ReceiptText },
  { href: "/dashboard", label: "Analytics", icon: BarChart3, hash: "#analytics" },
  { href: "/dashboard/settings", label: "Settings", icon: Settings }
];

export function DashboardSidebar({
  merchantName,
  merchantEmail,
  activeHref
}: {
  merchantName: string;
  merchantEmail: string;
  activeHref?: string;
}) {
  const initials =
    merchantName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "T";

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[200px] flex-col bg-ink px-4 py-6 text-white">
      <Link href="/dashboard" className="block">
        <p className="text-[18px] font-extrabold leading-none">Tapp.</p>
        <p className="mt-2 truncate text-xs text-white/50">{merchantName}</p>
      </Link>

      <nav className="mt-8 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const href = item.hash ? `${item.href}${item.hash}` : item.href;
          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={href}
              className={`flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition ${
                activeHref === item.href
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:bg-white/10 hover:text-white/80"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <div className="rounded-2xl bg-white/10 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-extrabold text-ink">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{merchantName}</p>
              <p className="truncate text-[11px] text-white/45">{merchantEmail}</p>
            </div>
          </div>
        </div>
        <form action={logout} className="mt-3">
          <button className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold text-white/55 transition hover:bg-white/10 hover:text-white">
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </form>
      </div>
    </aside>
  );
}
