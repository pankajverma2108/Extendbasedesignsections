"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { BookOpen, CalendarPlus, ConciergeBell, Home, PackagePlus, Search, ShoppingBag } from "lucide-react";

import { useGuestExperience } from "@/state/guest-experience-provider";
import { cn } from "@/lib/utils";

type GuestNavBadge = "cart" | "borrow";

type GuestNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: GuestNavBadge;
};

const navItems: GuestNavItem[] = [
  { label: "Dashboard", href: "/guest", icon: Home },
  { label: "Services", href: "/guest/services", icon: ConciergeBell },
  { label: "Add-ons", href: "/guest/addons", icon: ShoppingBag, badge: "cart" },
  { label: "Borrow", href: "/guest/borrow", icon: PackagePlus, badge: "borrow" },
  { label: "Extend", href: "/guest/extend", icon: CalendarPlus },
  { label: "Guide", href: "/guest/guide", icon: BookOpen },
  { label: "Lost & Found", href: "/guest/lost-found", icon: Search },
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/guest") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function GuestNav() {
  const pathname = usePathname();
  const { badgeCounts } = useGuestExperience();

  return (
    <>
      <nav className="hidden rounded-[22px] border border-dashed border-white/20 bg-white/[0.03] p-2 shadow-[0_18px_42px_rgba(0,0,0,0.22)] md:block" aria-label="Guest navigation">
        <div className="grid grid-cols-7 gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);
            const count = item.badge ? badgeCounts[item.badge] : 0;

            return (
              <Link
                key={item.href}
                className={cn(
                  "group relative flex min-h-16 flex-col items-center justify-center gap-1 rounded-[16px] border border-transparent px-3 py-2 text-center text-[11px] font-bold uppercase tracking-[0.08em] text-white/58 transition duration-300 hover:border-white/15 hover:bg-white/[0.05] hover:text-white",
                  active && "border-white/20 bg-[#c92420] text-white shadow-[0_12px_28px_rgba(201,36,32,0.24)]",
                )}
                href={item.href}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {count > 0 ? (
                  <span className="absolute right-2 top-2 rounded-full bg-[#f9cb37] px-1.5 py-0.5 text-[10px] leading-none text-[#111111]">
                    {count}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </nav>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#07070a]/95 px-3 pb-3 pt-2 shadow-[0_-18px_42px_rgba(0,0,0,0.34)] backdrop-blur md:hidden"
        aria-label="Guest mobile navigation"
      >
        <div className="flex gap-2 overflow-x-auto pb-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);
            const count = item.badge ? badgeCounts[item.badge] : 0;

            return (
              <Link
                key={item.href}
                className={cn(
                  "relative flex min-w-[74px] flex-col items-center justify-center gap-1 rounded-[14px] border border-white/10 bg-white/[0.03] px-2 py-2 text-[10px] font-bold uppercase tracking-[0.06em] text-white/62 transition duration-300",
                  active && "border-[#c92420] bg-[#c92420] text-white",
                )}
                href={item.href}
              >
                <Icon className="h-4 w-4" />
                <span className="whitespace-nowrap">{item.label}</span>
                {count > 0 ? (
                  <span className="absolute right-1.5 top-1.5 rounded-full bg-[#f9cb37] px-1.5 py-0.5 text-[9px] leading-none text-[#111111]">
                    {count}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
