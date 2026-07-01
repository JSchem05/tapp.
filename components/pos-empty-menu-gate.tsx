"use client";

import { PosSidebar, readSidebarCollapsed, writeSidebarCollapsed } from "@/components/pos-sidebar";
import type { PosView } from "@/lib/pos/app-data";
import { ownerAppPath, staffAppPath } from "@/lib/pos/view-routes";
import type { Staff } from "@/lib/types";
import { MenuSquare } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function PosEmptyMenuGate({
  mode,
  staff
}: {
  mode: "owner" | "staff";
  staff: Staff[];
}) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const activeView: PosView = mode === "owner" ? "dashboard" : "menu";

  useEffect(() => {
    setCollapsed(readSidebarCollapsed());
  }, []);

  function changeView(view: PosView) {
    router.push(mode === "owner" ? ownerAppPath(view) : staffAppPath(view));
  }

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      writeSidebarCollapsed(next);
      return next;
    });
  }

  return (
    <main className="flex min-h-screen bg-cream">
      <PosSidebar
        mode={mode}
        activeView={activeView}
        collapsed={collapsed}
        staff={staff}
        selectedStaffId={null}
        onToggleCollapsed={toggleCollapsed}
        onViewChange={changeView}
        onSelectStaff={() => undefined}
        className="min-h-screen"
      />
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="max-w-md rounded-[16px] bg-white p-8 text-center shadow-soft">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ink text-white shadow-soft">
            <MenuSquare className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-ink">
            Set up your menu to start taking orders
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Add categories and items in Menu before taking orders.
          </p>
          <div className="mt-6">
            <Link
              href={mode === "owner" ? "/pos?view=menu" : "/staff?view=menu"}
              className="inline-flex h-12 items-center justify-center rounded-[12px] bg-ink px-4 text-sm font-extrabold text-white"
            >
              Go to Menu
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
