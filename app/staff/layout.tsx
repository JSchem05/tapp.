import { logoutDevice } from "@/app/device/actions";
import { StaffTabs } from "@/app/staff/staff-tabs";
import { getStaffContext } from "@/lib/merchant-context";
import { LogOut } from "lucide-react";

export default async function StaffLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { merchant } = await getStaffContext();

  return (
    <main className="min-h-screen bg-cream">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-extrabold text-ink">Tapp.</p>
            <p className="text-xs text-muted">{merchant.name}</p>
          </div>
          <StaffTabs />
          <form action={logoutDevice}>
            <button className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-line bg-white px-3 text-sm font-semibold text-ink hover:bg-[#FAFAFA]">
              <LogOut className="h-4 w-4" />
              Log out this device
            </button>
          </form>
        </div>
      </header>
      {children}
    </main>
  );
}
