"use client";

import { Grid3X3, ReceiptText } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/staff", label: "POS", icon: Grid3X3, exact: true },
  { href: "/staff/receipts", label: "Receipts", icon: ReceiptText }
];

export function StaffTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-2">
      {tabs.map((tab) => {
        const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`inline-flex h-10 items-center gap-2 rounded-[10px] border px-4 text-sm font-semibold ${
              active
                ? "border-ink bg-ink text-white"
                : "border-line bg-white text-ink hover:bg-[#FAFAFA]"
            }`}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
