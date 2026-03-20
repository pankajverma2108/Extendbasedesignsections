"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { MobileStaggeredMenu } from "@/components/marketing/mobile-staggered-menu";
import { navItems, siteMeta } from "@/content/site";
import { cn } from "@/lib/utils";

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--vh-border)] bg-[var(--vh-surface-2)]">
      <div className="vh-container py-2.5 md:py-3.5">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3">
            <Image alt={siteMeta.name} height={40} priority src="/logo.png" width={120} />
          </Link>
          <div className="hidden gap-6 md:flex">
            {navItems.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-sm font-bold transition-colors",
                    active ? "text-[var(--vh-hot)]" : "text-white hover:text-[var(--vh-hot)]",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <MobileStaggeredMenu items={navItems} pathname={pathname} />
        </div>
      </div>
    </nav>
  );
}
