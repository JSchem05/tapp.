"use client";

import { logout } from "@/app/dashboard/actions";
import { logoutStaffDevice } from "@/app/device/actions";
import type { PosView } from "@/lib/pos/app-data";
import type { Staff } from "@/lib/types";
import {
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  Home,
  LogOut,
  MenuSquare,
  ReceiptText,
  Settings,
  UtensilsCrossed
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const PASTEL_PALETTE = ["#E8F0FE", "#E6F7EF", "#FEF3E2", "#F0EBFC", "#FDEDF3"] as const;
const SIDEBAR_STORAGE_KEY = "tapp_pos_sidebar_collapsed";

const ownerNav: Array<{ id: PosView; label: string; icon: LucideIcon }> = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "pos", label: "POS", icon: Grid3X3 },
  { id: "tables", label: "Table Reservation", icon: UtensilsCrossed },
  { id: "receipts", label: "Receipt", icon: ReceiptText },
  { id: "menu", label: "Menu", icon: MenuSquare },
  { id: "settings", label: "Settings", icon: Settings }
];

const staffNav: Array<{ id: PosView; label: string; icon: LucideIcon }> = [
  { id: "pos", label: "POS", icon: Grid3X3 },
  { id: "tables", label: "Table Reservation", icon: UtensilsCrossed },
  { id: "receipts", label: "Receipt", icon: ReceiptText },
  { id: "menu", label: "Menu", icon: MenuSquare }
];

export function readSidebarCollapsed() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "1";
}

export function writeSidebarCollapsed(collapsed: boolean) {
  window.localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? "1" : "0");
}

export function PosSidebar({
  mode,
  activeView,
  collapsed,
  staff,
  selectedStaffId,
  onToggleCollapsed,
  onViewChange,
  onSelectStaff,
  className = ""
}: {
  mode: "owner" | "staff";
  activeView: PosView;
  collapsed: boolean;
  staff: Staff[];
  selectedStaffId: string | null;
  onToggleCollapsed: () => void;
  onViewChange: (view: PosView) => void;
  onSelectStaff: (staffId: string) => void;
  className?: string;
}) {
  const links = mode === "owner" ? ownerNav : staffNav;

  return (
    <aside
      className={`flex shrink-0 flex-col bg-ink py-6 transition-[width] duration-200 ease-in-out ${
        collapsed ? "w-16 px-2" : "w-[200px] px-4"
      } ${className}`}
    >
      <button
        type="button"
        onClick={onToggleCollapsed}
        className="mb-4 flex h-9 w-9 items-center justify-center self-start rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      <div className={`shrink-0 ${collapsed ? "px-1 text-center" : ""}`}>
        <p className="text-lg font-bold text-white">{collapsed ? "T" : "Tapp."}</p>
        {!collapsed ? <p className="text-xs text-white/50">POS</p> : null}
      </div>

      <nav className="mt-6 flex flex-col gap-1">
        {links.map((link) => {
          const active = activeView === link.id;
          const Icon = link.icon;
          return (
            <button
              key={link.id}
              type="button"
              title={collapsed ? link.label : undefined}
              onClick={() => onViewChange(link.id)}
              className={`flex h-10 items-center rounded-lg text-sm font-semibold transition ${
                collapsed ? "justify-center px-0" : "gap-2.5 px-3"
              } ${
                active
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:bg-white/5 hover:text-white/80"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed ? <span className="truncate">{link.label}</span> : null}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2 border-t border-white/10 pt-4">
        {staff.length > 0 ? (
          <div className={`flex flex-col gap-2 ${collapsed ? "items-center" : ""}`}>
            {staff.map((member, index) => {
              const selected = selectedStaffId === member.id;
              const pastel = PASTEL_PALETTE[index % PASTEL_PALETTE.length];
              return (
                <button
                  key={member.id}
                  type="button"
                  title={collapsed ? member.name : undefined}
                  onClick={() => onSelectStaff(member.id)}
                  className={`flex items-center rounded-lg transition ${
                    collapsed ? "justify-center p-1" : "gap-2.5 px-2 py-1.5"
                  } ${selected ? "bg-white/10" : "hover:bg-white/5"}`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-ink ${
                      selected ? "ring-2 ring-blue" : ""
                    }`}
                    style={{ backgroundColor: pastel }}
                  >
                    {member.name.trim()[0]?.toUpperCase() ?? "?"}
                  </span>
                  {!collapsed ? (
                    <span className="truncate text-sm font-semibold text-white">
                      {formatStaffShortName(member.name)}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}

        {mode === "owner" ? (
          <form action={logout}>
            <button
              type="submit"
              title={collapsed ? "Log out" : undefined}
              className={`flex h-10 w-full items-center rounded-lg text-sm font-semibold text-white/55 transition hover:bg-white/10 hover:text-white ${
                collapsed ? "justify-center px-0" : "gap-2.5 px-3"
              }`}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed ? <span>Log out</span> : null}
            </button>
          </form>
        ) : (
          <form action={logoutStaffDevice}>
            <button
              type="submit"
              title={collapsed ? "Log out device" : undefined}
              className={`flex h-10 w-full items-center rounded-lg text-sm font-semibold text-white/55 transition hover:bg-white/10 hover:text-white ${
                collapsed ? "justify-center px-0" : "gap-2.5 px-3"
              }`}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed ? <span>Log out device</span> : null}
            </button>
          </form>
        )}
      </div>
    </aside>
  );
}

function formatStaffShortName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Staff";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}
