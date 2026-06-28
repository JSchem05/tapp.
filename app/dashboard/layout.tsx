import { logout } from "@/app/dashboard/actions";
import { HeaderClock, OpenClosedToggle } from "@/components/dashboard-status";
import { getAuthedMerchant } from "@/lib/auth";
import { LogOut, MenuSquare, Settings } from "lucide-react";
import Link from "next/link";

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { merchant } = await getAuthedMerchant();

  return (
    <main className="min-h-screen bg-transparent">
      <header className="sticky top-0 z-40 h-auto border-b border-line bg-white/75 px-4 py-3 shadow-sm backdrop-blur-[20px] sm:px-6 lg:h-16 lg:px-8 lg:py-0">
        <div className="mx-auto grid h-full max-w-7xl gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="blue-gradient-mark flex h-9 w-9 items-center justify-center rounded-[10px] text-base font-extrabold text-white shadow-soft">
                T
              </div>
              <div>
                <p className="text-base font-semibold leading-none tracking-tight text-ink">Tapp.</p>
                <p className="mt-1 text-[11px] font-medium text-[#9CA3AF]">{merchant.email}</p>
              </div>
            </Link>
          </div>

          <div className="justify-self-start lg:justify-self-center">
            <HeaderClock />
          </div>

          <nav className="flex items-center gap-2 lg:justify-end">
            <OpenClosedToggle />
            <Link
              href="/pos"
              className="inline-flex h-9 items-center gap-2 rounded-[12px] bg-amber px-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-clay hover:shadow-[0_4px_16px_rgba(79,110,247,0.35)]"
            >
              <MenuSquare className="h-4 w-4" />
              POS
            </Link>
            <Link
              href="/pos/menu"
              className="inline-flex h-9 items-center gap-2 rounded-[12px] border border-line bg-white/60 px-3 text-sm font-semibold text-amber backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:shadow-soft"
            >
              <MenuSquare className="h-4 w-4" />
              Menu
            </Link>
            <Link
              href="/dashboard/settings"
              className="inline-flex h-9 items-center gap-2 rounded-[12px] border border-line bg-white/60 px-3 text-sm font-semibold text-amber backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:shadow-soft"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
            <form action={logout}>
              <button className="inline-flex h-9 items-center gap-2 rounded-[12px] bg-ink px-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-soft">
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </main>
  );
}
