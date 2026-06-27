import { logout } from "@/app/dashboard/actions";
import { HeaderClock, OpenClosedToggle } from "@/components/dashboard-status";
import { getAuthedMerchant } from "@/lib/auth";
import { LogOut, ReceiptText, Settings } from "lucide-react";
import Link from "next/link";

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { merchant } = await getAuthedMerchant();

  return (
    <main className="min-h-screen bg-cream">
      <header className="sticky top-0 z-40 h-auto border-b border-line bg-white/95 px-4 py-3 backdrop-blur sm:px-6 lg:h-16 lg:px-8 lg:py-0">
        <div className="mx-auto grid h-full max-w-7xl gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-ink text-white shadow-sm">
                <ReceiptText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-extrabold leading-none tracking-tight text-ink">Tapp.</p>
                <p className="mt-1 text-xs font-medium text-muted">{merchant.name}</p>
              </div>
            </Link>
          </div>

          <div className="justify-self-start lg:justify-self-center">
            <HeaderClock />
          </div>

          <nav className="flex items-center gap-2 lg:justify-end">
            <OpenClosedToggle />
            <Link
              href="/dashboard/settings"
              className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-transparent bg-white px-3 text-sm font-semibold text-ink transition hover:bg-cream hover:text-amber"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
            <form action={logout}>
              <button className="inline-flex h-9 items-center gap-2 rounded-[10px] bg-ink px-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black hover:shadow-soft">
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
