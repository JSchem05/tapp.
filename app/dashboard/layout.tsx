import { logout } from "@/app/dashboard/actions";
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
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 rounded-2xl border border-coffee/10 bg-paper/85 p-4 shadow-soft backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-coffee text-paper">
              <ReceiptText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none text-ink">tapp.</p>
              <p className="mt-1 text-sm text-coffee/65">{merchant.name}</p>
            </div>
          </Link>

          <nav className="flex items-center gap-2">
            <Link
              href="/dashboard/settings"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-coffee/10 bg-white px-3 text-sm font-semibold text-coffee transition hover:bg-cream"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
            <form action={logout}>
              <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-coffee px-3 text-sm font-semibold text-paper transition hover:bg-ink">
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
