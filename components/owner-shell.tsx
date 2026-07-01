"use client";

import { PosSidebar, readSidebarCollapsed, writeSidebarCollapsed } from "@/components/pos-sidebar";
import type { PosView } from "@/lib/pos/app-data";
import { ownerAppPath } from "@/lib/pos/view-routes";
import type { Staff } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function OwnerShell({
  activeView,
  staff,
  children
}: {
  activeView: PosView;
  staff: Staff[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(readSidebarCollapsed());
  }, []);

  function changeView(view: PosView) {
    router.push(ownerAppPath(view));
  }

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      writeSidebarCollapsed(next);
      return next;
    });
  }

  return (
    <div className="flex h-screen min-h-0 w-full overflow-hidden bg-cream">
      <PosSidebar
        mode="owner"
        activeView={activeView}
        collapsed={collapsed}
        staff={staff}
        selectedStaffId={null}
        onToggleCollapsed={toggleCollapsed}
        onViewChange={changeView}
        onSelectStaff={() => undefined}
        className="h-screen"
      />
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
