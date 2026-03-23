"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

import type { NavItem } from "@/content/types";
import iconBed from "@/src/assets/icons/Icon.svg";
import iconEvent from "@/src/assets/icons/Icon-2.svg";
import iconArrow from "@/src/assets/icons/Icon-6.svg";
import iconCalendar from "@/src/assets/icons/Icon-7.svg";
import { StickerTag } from "@/components/shared/sticker-tag";

type FigmaMenuCard = {
  href: string;
  title: string;
  subtitle: string;
  bg: string;
  text: string;
  mutedText: string;
  rotate: string;
  top: string;
  left: string;
  icon: typeof iconBed;
  iconBg?: string;
  badge?: string;
};

const figmaMenuCards: FigmaMenuCard[] = [
  {
    href: "/property",
    title: "Property",
    subtitle: "find your corner...",
    bg: "#FF2E62",
    text: "#FFFFFF",
    mutedText: "rgba(255,255,255,0.8)",
    rotate: "-2deg",
    top: "30px",
    left: "21px",
    icon: iconBed,
    badge: "New",
  },
  {
    href: "/events",
    title: "Events",
    subtitle: "what's poppin?",
    bg: "#00D1FF",
    text: "#FFFFFF",
    mutedText: "rgba(255,255,255,0.82)",
    rotate: "1deg",
    top: "212px",
    left: "26px",
    icon: iconEvent,
    iconBg: "rgba(255,255,255,0.2)",
  },
  {
    href: "/about",
    title: "Social",
    subtitle: "meet the crew",
    bg: "#39FF14",
    text: "#230F14",
    mutedText: "rgba(35,15,20,0.6)",
    rotate: "-2deg",
    top: "414px",
    left: "21px",
    icon: iconCalendar,
  },
];

function DotsMorphButton({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  const dots = Array.from({ length: 9 }, (_, index) => index);

  const activeDots = open ? [0, 2, 4, 6, 8] : dots;

  return (
    <button
      aria-expanded={open}
      aria-label={open ? "Close menu" : "Open menu"}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--vh-surface-2)] text-white"
      onClick={onClick}
      type="button"
    >
      <span className="relative h-4 w-4">
        {dots.map((dot) => {
          const row = Math.floor(dot / 3);
          const col = dot % 3;

          const closedX = col * 6;
          const closedY = row * 6;

          const openPositions: Record<number, { x: number; y: number; rotate?: number }> = {
            0: { x: 0, y: 0, rotate: 45 },
            2: { x: 12, y: 0, rotate: -45 },
            4: { x: 6, y: 6 },
            6: { x: 0, y: 12, rotate: -45 },
            8: { x: 12, y: 12, rotate: 45 },
          };

          const target = openPositions[dot] ?? { x: 6, y: 6 };
          const visible = activeDots.includes(dot);

          return (
            <motion.span
              key={dot}
              animate={
                open
                  ? {
                      x: target.x,
                      y: target.y,
                      opacity: visible ? 1 : 0,
                      scaleX: dot === 4 ? 0.35 : 1.55,
                      scaleY: dot === 4 ? 0.35 : 0.45,
                      rotate: target.rotate ?? 0,
                      borderRadius: 999,
                    }
                  : {
                      x: closedX,
                      y: closedY,
                      opacity: 1,
                      scaleX: 1,
                      scaleY: 1,
                      rotate: 0,
                      borderRadius: 999,
                    }
              }
              className="absolute left-0 top-0 h-[4px] w-[4px] bg-white"
              initial={false}
              transition={{ duration: 0.24, ease: "easeOut" }}
            />
          );
        })}
      </span>
    </button>
  );
}

type MobileStaggeredMenuProps = {
  items: NavItem[];
};

export function MobileStaggeredMenu({ items }: MobileStaggeredMenuProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;

    if (open) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  const propertyLink = items.find((item) => item.href === "/property")?.href ?? "/property";
  const eventLink = items.find((item) => item.href === "/events")?.href ?? "/events";
  const aboutLink = items.find((item) => item.href === "/about")?.href ?? "/about";

  const cards = figmaMenuCards.map((card) => {
    if (card.title === "Property") {
      return { ...card, href: propertyLink };
    }

    if (card.title === "Events") {
      return { ...card, href: eventLink };
    }

    return { ...card, href: aboutLink };
  });

  return (
    <div className="md:hidden">
      <DotsMorphButton open={open} onClick={() => setOpen((value) => !value)} />

      <AnimatePresence>
        {open ? (
          <>
            <motion.div
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-40 bg-black/65"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            <motion.aside
              animate={{ opacity: 1, y: 0 }}
              className="fixed inset-0 z-50 bg-[#230F14]"
              exit={{ opacity: 0, y: 6 }}
              initial={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <div className="mx-auto h-[100dvh] w-full max-w-[405px] overflow-hidden">
                <div className="absolute left-1/2 top-0 inline-flex w-[405px] -translate-x-1/2 items-center justify-between p-6">
                  <DotsMorphButton open={open} onClick={() => setOpen(false)} />
                  <div className="flex flex-1 items-center justify-center pr-12">
                    <span className="font-biorhyme text-2xl font-bold leading-[30px] text-slate-100">Menu</span>
                  </div>
                </div>

                <div className="absolute left-1/2 top-24 h-[760px] w-[405px] -translate-x-1/2">
                  <motion.div
                    animate="show"
                    className="relative h-full w-full"
                    initial="hidden"
                    variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
                  >
                    {cards.map((card) => (
                      <motion.div
                        key={card.title}
                        className="absolute inline-flex w-[357px] flex-col"
                        style={{ left: card.left, top: card.top, transform: `rotate(${card.rotate})` }}
                        variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
                      >
                        <Link
                          className="relative flex flex-col rounded-[4px] p-1"
                          href={card.href}
                          onClick={() => setOpen(false)}
                          style={{ background: card.bg }}
                        >
                          <div className="flex h-[171px] flex-col justify-between rounded-[2px] border-2 border-white/30 bg-[#230F14]/10 p-4">
                            <div className="relative flex items-start justify-between">
                              <Image alt={`${card.title} icon`} className="h-12 w-12" src={card.icon} style={{ filter: "brightness(1.1)" }} />

                              {card.badge ? (
                                <StickerTag
                                  bg="#FFFFFF"
                                  className="rounded-xl border border-white/20 px-2 py-1 text-[10px] font-bold not-italic uppercase tracking-[1px]"
                                  label={card.badge}
                                  rotate="rotate-0"
                                  text="#FF2E62"
                                />
                              ) : (
                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: card.iconBg ?? "transparent" }}>
                                  <Image alt="open" className="h-[10px] w-[10px]" src={iconArrow} style={{ filter: "brightness(1.2)" }} />
                                </span>
                              )}
                            </div>

                            <div>
                              <p className="font-biorhyme text-[30px] font-bold uppercase leading-9" style={{ color: card.text }}>
                                {card.title}
                              </p>
                              <p className="font-encode text-sm italic leading-5" style={{ color: card.mutedText }}>
                                {card.subtitle}
                              </p>
                            </div>
                          </div>
                        </Link>

                        {card.title === "Property" ? (
                          <StickerTag className="absolute -right-1 -top-4" label="Book Now!" rotate="rotate-[12deg]" />
                        ) : null}
                      </motion.div>
                    ))}

                    <div className="absolute left-1/2 top-[550px] inline-flex w-[361px] -translate-x-1/2 flex-col gap-4">
                      <Link
                        className="flex h-[100px] w-full rotate-[1deg] flex-col rounded-[4px] bg-[#1E293B] p-1"
                        href="/property"
                        onClick={() => setOpen(false)}
                      >
                        <div className="flex h-full flex-col justify-between rounded-[2px] border border-[#64748B] bg-[#334155]/50 p-4">
                          <div className="h-[24px] w-[24px] rounded-lg bg-[#FF2E62]" />
                          <p className="font-biorhyme text-lg font-bold uppercase leading-6 text-white">My Stay</p>
                        </div>
                      </Link>

                      <Link
                        className="flex h-[100px] w-full rotate-[-2deg] flex-col rounded-[4px] bg-white p-1"
                        href="/about"
                        onClick={() => setOpen(false)}
                      >
                        <div className="flex h-full flex-col justify-between rounded-[2px] border border-[#CBD5E1] bg-[#F1F5F9] p-4">
                          <div className="h-[24px] w-[24px] rounded-lg bg-[#1E293B]" />
                          <p className="font-biorhyme text-lg font-bold uppercase leading-6 text-[#1E293B]">Profile</p>
                        </div>
                      </Link>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
