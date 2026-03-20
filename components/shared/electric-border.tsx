"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";

type ElectricBorderProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  tone?: "pink" | "blue" | "green";
  speed?: number;
  innerClassName?: string;
};

const toneMap: Record<NonNullable<ElectricBorderProps["tone"]>, string> = {
  pink: "from-[var(--vh-hot)] via-[var(--vh-amber)] to-[var(--vh-hot)]",
  blue: "from-[var(--vh-cyan)] via-[var(--vh-ice)] to-[var(--vh-cyan)]",
  green: "from-[var(--vh-lime)] via-[var(--vh-ice)] to-[var(--vh-lime)]",
};

export function ElectricBorder({
  children,
  className,
  tone = "pink",
  speed = 3.2,
  innerClassName,
  ...props
}: ElectricBorderProps) {
  return (
    <div className={cn("group relative rounded-[16px]", className)} {...props}>
      <motion.div
        aria-hidden
        animate={{ rotate: [0, 360] }}
        className={cn(
          "pointer-events-none absolute -inset-[1px] rounded-[16px] bg-conic from-transparent via-white/20 to-transparent opacity-80",
        )}
        transition={{ duration: speed, ease: "linear", repeat: Infinity }}
      />
      <motion.div
        aria-hidden
        animate={{ backgroundPositionX: ["0%", "100%", "0%"] }}
        className={cn(
          "pointer-events-none absolute inset-0 rounded-[16px] bg-[length:200%_100%] bg-gradient-to-r blur-[9px] opacity-65",
          toneMap[tone],
        )}
        transition={{ duration: speed, ease: "easeInOut", repeat: Infinity }}
      />
      <div className={cn("relative rounded-[15px] border border-white/20 bg-[#130b10]", innerClassName)}>{children}</div>
    </div>
  );
}
