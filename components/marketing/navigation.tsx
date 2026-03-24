"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { MobileStaggeredMenu } from "@/components/marketing/mobile-staggered-menu";
import { navItems, siteMeta } from "@/content/site";
import { cn } from "@/lib/utils";

export function Navigation() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;

    const onScroll = () => {
      const currentY = window.scrollY;
      const goingDown = currentY > lastY + 6;
      const goingUp = currentY < lastY - 6;

      setIsScrolled(currentY > 18);

      if (currentY < 48 || goingUp) {
        setIsVisible(true);
      } else if (goingDown) {
        setIsVisible(false);
      }

      lastY = currentY;
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : -110 }}
      className="fixed inset-x-0 top-4 z-50"
      initial={false}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      <div className="vh-container">
        <div className="mx-auto hidden max-w-7xl lg:block">
          <div
            className={cn(
              "grid grid-cols-3 items-center rounded-full px-4 py-2 transition-all duration-200",
              isScrolled ? "border border-white/12 bg-[rgba(15,16,26,0.88)] shadow-[0_20px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl" : "bg-transparent",
            )}
          >
            <div className="flex items-center">
              <Link href="/" className="flex items-center px-2 py-1">
                <Image alt={siteMeta.name} className="h-auto w-[88px] object-contain opacity-90" height={160} priority src="/logo.png" width={160} />
              </Link>
            </div>

            <div className="flex items-center justify-center gap-1.5">
              {navItems.map((item) => {
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white",
                      active && "bg-white text-[var(--vh-surface-2)] hover:bg-white hover:text-[var(--vh-surface-2)]",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-3">
              <Link
                href="/policies/guest"
                className="rounded-full px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                Policies
              </Link>
              <Link
                href="/property"
                className="rounded-full bg-[var(--vh-pink)] px-4 py-2 text-sm font-medium text-white shadow-[0px_-1px_0px_0px_#FFFFFF40_inset,_0px_1px_0px_0px_#FFFFFF40_inset] transition hover:bg-[var(--vh-pink-soft)]"
              >
                Book Now
              </Link>
            </div>
          </div>
        </div>

        <div className="mx-auto flex max-w-7xl items-center lg:hidden">
          <div className="flex w-full items-center justify-between rounded-full border border-white/12 bg-[rgba(15,16,26,0.88)] px-2.5 py-2 shadow-[0_20px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl">
            <Link href="/" className="flex items-center px-2 py-1">
              <Image alt={siteMeta.name} className="h-auto w-[78px] object-contain opacity-90" height={140} priority src="/logo.png" width={140} />
            </Link>

            <div className="flex items-center gap-2">
              <Link
                href="/property"
                className="rounded-full bg-[var(--vh-pink)] px-3.5 py-2 text-xs font-medium whitespace-nowrap text-white shadow-[0px_-1px_0px_0px_#FFFFFF40_inset,_0px_1px_0px_0px_#FFFFFF40_inset]"
              >
                Book Now
              </Link>
              <MobileStaggeredMenu items={navItems} />
            </div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
