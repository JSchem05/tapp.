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
    <main className="min-h-screen bg-cream px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 grid gap-4 rounded-2xl border border-line bg-white p-4 shadow-soft lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-white">
                <ReceiptText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none text-ink">Tapp.</p>
                <p className="mt-1 text-sm text-muted">{merchant.name}</p>
              </div>
            </Link>
            <OpenClosedToggle />
          </div>

          <div className="justify-self-start lg:justify-self-center">
            <HeaderClock />
          </div>

          <nav className="flex items-center gap-2 lg:justify-end">
            <Link
              href="/dashboard/settings"
              className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-ink bg-white px-3 text-sm font-semibold text-ink transition hover:border-amber hover:text-amber"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
            <form action={logout}>
              <button className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-ink px-3 text-sm font-semibold text-white transition hover:bg-black">
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </form>
          </nav>
        </header>

        {children}
      </div>
    </main>
  );
}
