"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";

import { StickerTag } from "@/components/shared/sticker-tag";
import { Button } from "@/components/ui/button";
import type { GuestStickerTagConfig } from "@/components/guest/guest-sticker-tags";
import { cn } from "@/lib/utils";

type BentoCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  sticker?: GuestStickerTagConfig;
  ctaLabel?: string;
  href?: string;
  children?: ReactNode;
  className?: string;
};

export function BentoCard({
  title,
  description,
  icon: Icon,
  sticker,
  ctaLabel,
  href,
  children,
  className,
}: BentoCardProps) {
  return (
    <motion.article
      className={cn(
        "group flex h-full flex-col rounded-[22px] border border-dashed border-white/24 bg-[#07070a] p-5 shadow-[0_20px_45px_rgba(0,0,0,0.24)] transition-colors duration-300 hover:border-white/38 md:p-6",
        className,
      )}
      initial={{ opacity: 0, y: 18 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      viewport={{ once: true, margin: "-10%" }}
      whileHover={{ scale: 1.012, y: -3 }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-white/10 bg-white/[0.05] text-white shadow-[0_12px_30px_rgba(0,0,0,0.22)]">
          <Icon className="h-5 w-5" />
        </div>
        {sticker ? (
          <StickerTag
            bg={sticker.bg}
            className="px-3 py-1.5 text-[10px] font-bold not-italic uppercase tracking-[0.12em]"
            label={sticker.label}
            rotate={sticker.rotate}
            text={sticker.text}
          />
        ) : null}
      </div>

      <div className="mt-5 flex flex-1 flex-col">
        <h3 className="font-suez text-[26px] uppercase leading-[1] tracking-[-0.03em] text-white">{title}</h3>
        <p className="mt-3 text-sm leading-7 text-white/68">{description}</p>
        {children ? <div className="mt-5">{children}</div> : null}
      </div>

      {href && ctaLabel ? (
        <Button asChild className="mt-6 h-10 rounded-[14px] bg-[#c92420] px-4 text-white hover:bg-[#a91d1a]">
          <Link href={href}>
            {ctaLabel}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      ) : null}
    </motion.article>
  );
}
