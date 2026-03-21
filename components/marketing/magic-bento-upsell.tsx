"use client";

import Link from "next/link";
import { motion } from "motion/react";

import { ElectricBorder } from "@/components/shared/electric-border";
import { Button } from "@/components/ui/button";

type BentoItem = {
  id: string;
  title: string;
  body: string;
  kicker: string;
  tone: "pink" | "blue" | "green";
  colSpan?: string;
};

type MagicBentoUpsellProps = {
  title: string;
  subtitle: string;
  items: BentoItem[];
};

export function MagicBentoUpsell({ title, subtitle, items }: MagicBentoUpsellProps) {
  return (
    <div className="vh-container">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="vh-kicker text-[var(--vh-cyan)]">Add-ons</p>
          <h2 className="vh-title font-biorhyme">{title}</h2>
          <p className="mt-1 text-sm text-white/75">{subtitle}</p>
        </div>
      </div>

      <motion.div
        className="grid auto-rows-[132px] grid-cols-2 gap-3 sm:auto-rows-[140px] md:grid-cols-4 md:gap-4"
        initial="hidden"
        viewport={{ once: true, margin: "-12%" }}
        whileInView="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
        }}
      >
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            variants={{ hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            whileHover={{ y: -4, scale: 1.01 }}
          >
            <ElectricBorder
              className={item.colSpan ?? (index === 0 ? "col-span-2 md:col-span-2 md:row-span-2" : "")}
              innerClassName="h-full p-3 sm:p-4"
              tone={item.tone}
            >
              <div className="flex h-full flex-col justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">{item.kicker}</p>
                <div>
                  <h3 className="font-biorhyme text-base leading-tight text-white sm:text-lg">{item.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-white/75 sm:text-sm">{item.body}</p>
                </div>
              </div>
            </ElectricBorder>
          </motion.div>
        ))}

        <motion.div
          className="col-span-2 md:col-span-1 md:row-span-2"
          variants={{ hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          whileHover={{ y: -5, scale: 1.01 }}
        >
          <ElectricBorder innerClassName="h-full p-4" tone="pink">
            <div className="flex h-full flex-col justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">Featured Upsell</p>
                <h3 className="mt-2 font-biorhyme text-2xl leading-[1.05] text-white">Night Vibe Pack</h3>
                <p className="mt-2 text-xs leading-5 text-white/75">
                  Includes welcome drink, event pass, late checkout hold, and laundry credits.
                </p>
              </div>
              <Button asChild className="w-full">
                <Link href="/property">Add to Booking</Link>
              </Button>
            </div>
          </ElectricBorder>
        </motion.div>
      </motion.div>
    </div>
  );
}
