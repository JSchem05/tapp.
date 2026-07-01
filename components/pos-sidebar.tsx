"use client";

import type { Staff } from "@/lib/types";
import { BarChart3, MenuSquare, ReceiptText } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const PASTEL_PALETTE = ["#E8F0FE", "#E6F7EF", "#FEF3E2", "#F0EBFC", "#FDEDF3"] as const;

const ownerLinks = [
  { href: "/pos/menu", label: "Menu", icon: MenuSquare, match: (path: string) => path.startsWith("/pos/menu") },
  {
    href: "/dashboard/receipts",
    label: "Receipts",
    icon: ReceiptText,
    match: (path: string) => path.startsWith("/dashboard/receipts")
  },
  {
    href: "/dashboard",
    label: "Finance",
    icon: BarChart3,
    match: (path: string) =>
      path === "/dashboard" ||
      (path.startsWith("/dashboard/") && !path.startsWith("/dashboard/receipts"))
  }
] as const;

const staffLinks = [
  { href: "/staff/menu", label: "Menu", icon: MenuSquare, match: (path: string) => path.startsWith("/staff/menu") },
  {
    href: "/staff/receipts",
    label: "Receipts",
    icon: ReceiptText,
    match: (path: string) => path.startsWith("/staff/receipts")
  }
] as const;

export function PosSidebar({
  mode,
  staff,
  selectedStaffId,
  onSelectStaff,
  className = ""
}: {
  mode: "owner" | "staff";
  staff: Staff[];
  selectedStaffId: string | null;
  onSelectStaff: (staffId: string) => void;
  className?: string;
}) {
  const pathname = usePathname();
  const links = mode === "owner" ? ownerLinks : staffLinks;

  return (
    <aside
      className={`flex w-[200px] shrink-0 flex-col bg-ink px-4 py-6 ${className}`}
    >
      <div className="shrink-0">
        <p className="text-lg font-bold text-white">Tapp.</p>
        <p className="text-xs text-white/50">POS</p>
      </div>

      <nav className="mt-8 flex flex-col gap-1">
        {links.map((link) => {
          const active = link.match(pathname);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex h-10 items-center gap-2.5 rounded-lg px-3 text-sm font-semibold transition ${
                active
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:bg-white/5 hover:text-white/80"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {staff.length > 0 ? (
        <div className="mt-auto flex flex-col gap-2 border-t border-white/10 pt-4">
          {staff.map((member, index) => {
            const selected = selectedStaffId === member.id;
            const pastel = PASTEL_PALETTE[index % PASTEL_PALETTE.length];
            return (
              <button
                key={member.id}
                type="button"
                onClick={() => onSelectStaff(member.id)}
                className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition ${
                  selected ? "bg-white/10" : "hover:bg-white/5"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-ink ${
                    selected ? "ring-2 ring-blue" : ""
                  }`}
                  style={{ backgroundColor: pastel }}
                >
                  {member.name.trim()[0]?.toUpperCase() ?? "?"}
                </span>
                <span className="truncate text-sm font-semibold text-white">
                  {formatStaffShortName(member.name)}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </aside>
  );
}

function formatStaffShortName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Staff";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}
