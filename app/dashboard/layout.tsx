import { DashboardSidebar } from "@/app/dashboard/dashboard-sidebar";
import { getAuthedMerchant } from "@/lib/auth";

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { merchant } = await getAuthedMerchant();

  return (
    <main className="min-h-screen bg-cream">
      <DashboardSidebar merchantName={merchant.name} merchantEmail={merchant.email} />
      <div className="min-h-screen px-6 py-8 lg:ml-[200px] lg:px-8">
        {children}
      </div>
    </main>
  );
}
