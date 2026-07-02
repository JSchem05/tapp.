"use client";

import { logout } from "@/app/dashboard/actions";
import { logoutStaffDevice } from "@/app/device/actions";
import type { PosView } from "@/lib/pos/app-data";
import type { Staff } from "@/lib/types";
import {
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

const ownerNav: Array<{ id: PosView; label: string; icon: LucideIcon }> = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "pos", label: "POS", icon: Grid3X3 },
  { id: "tables", label: "Tables", icon: UtensilsCrossed },
  { id: "receipts", label: "Receipts", icon: ReceiptText },
  { id: "menu", label: "Menu", icon: MenuSquare },
  { id: "settings", label: "Settings", icon: Settings }
];

const staffNav: Array<{ id: PosView; label: string; icon: LucideIcon }> = [
  { id: "pos", label: "POS", icon: Grid3X3 },
  { id: "tables", label: "Tables", icon: UtensilsCrossed },
  { id: "receipts", label: "Receipts", icon: ReceiptText },
  { id: "menu", label: "Menu", icon: MenuSquare }
];

export function PosBottomBar({
  mode,
  activeView,
  staff,
  selectedStaffId,
  onViewChange,
  onSelectStaff,
  interactive = true
}: {
  mode: "owner" | "staff";
  activeView: PosView;
  staff: Staff[];
  selectedStaffId: string | null;
  onViewChange: (view: PosView) => void;
  onSelectStaff: (staffId: string) => void;
  interactive?: boolean;
}) {
  const links = mode === "owner" ? ownerNav : staffNav;

  return (
    <nav
      className="z-40 shrink-0 border-t border-line bg-white shadow-bar"
      style={{ paddingBottom: "var(--safe-bottom)" }}
      aria-label="Main navigation"
    >
      <div className="mx-auto flex h-[68px] w-full max-w-6xl items-center gap-2 px-3 sm:px-5">
        {/* Brand */}
        <div className="hidden shrink-0 select-none pr-2 md:block">
          <p className="text-lg font-extrabold tracking-tight text-ink">
            Tapp<span className="text-blue">.</span>
          </p>
        </div>

        {/* Tabs */}
        <div className="flex min-w-0 flex-1 items-center justify-center gap-1 sm:gap-2">
          {links.map((link) => {
            const active = activeView === link.id;
            const Icon = link.icon;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => interactive && onViewChange(link.id)}
                aria-current={active ? "page" : undefined}
                className={`flex h-[52px] min-w-[64px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 transition sm:min-w-[76px] sm:px-3 ${
                  active
                    ? "bg-blueSoft text-blue"
                    : "text-muted hover:bg-cream hover:text-ink"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.4 : 2} />
                <span
                  className={`text-[11px] leading-none ${
                    active ? "font-bold" : "font-semibold"
                  }`}
                >
                  {link.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Staff picker + logout */}
        <div className="flex shrink-0 items-center gap-1.5 pl-1">
          {staff.length > 0 ? (
            <div className="flex items-center gap-1">
              {staff.map((member, index) => {
                const selected = selectedStaffId === member.id;
                const pastel = PASTEL_PALETTE[index % PASTEL_PALETTE.length];
                return (
                  <button
                    key={member.id}
                    type="button"
                    title={member.name}
                    onClick={() => interactive && onSelectStaff(member.id)}
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-ink transition ${
                      selected
                        ? "ring-2 ring-blue ring-offset-2 ring-offset-white"
                        : "opacity-80 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: pastel }}
                  >
                    {member.name.trim()[0]?.toUpperCase() ?? "?"}
                  </button>
                );
              })}
            </div>
          ) : null}

          <form action={mode === "owner" ? logout : logoutStaffDevice}>
            <button
              type="submit"
              title={mode === "owner" ? "Log out" : "Log out device"}
              className="ml-1 flex h-10 w-10 items-center justify-center rounded-xl text-muted transition hover:bg-cream hover:text-ink"
            >
              <LogOut style={{ width: 18, height: 18 }} />
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
