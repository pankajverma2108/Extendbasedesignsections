"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BedDouble, CalendarDays, Ticket, X } from "lucide-react";

import type { NavItem } from "@/content/types";
import iconArrow from "@/src/assets/icons/Icon-2.svg";
import iconMyStay from "@/src/assets/icons/Icon-1.svg";
import iconProfile from "@/src/assets/icons/Icon.svg";
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
  iconType: "rooms" | "events" | "social";
  iconBg?: string;
  badge?: string;
  iconTone?: "light" | "dark";
};

const figmaMenuCards: FigmaMenuCard[] = [
  {
    href: "/property",
    title: "Rooms",
    subtitle: "find your corner...",
    bg: "#FF2E62",
    text: "#FFFFFF",
    mutedText: "rgba(255,255,255,0.8)",
    rotate: "-2deg",
    top: "30px",
    left: "21px",
    iconType: "rooms",
    badge: "New",
    iconTone: "light",
  },
  {
    href: "/events",
    title: "Events",
    subtitle: "what's poppin?",
    bg: "#00D1FF",
    text: "#FFFFFF",
    mutedText: "rgba(255,255,255,0.82)",
    rotate: "1.5deg",
    top: "211.5px",
    left: "26.2px",
    iconType: "events",
    iconBg: "rgba(255,255,255,0.2)",
    iconTone: "light",
  },
  {
    href: "/about",
    title: "Social",
    subtitle: "meet the crew",
    bg: "#39FF14",
    text: "#230F14",
    mutedText: "rgba(35,15,20,0.6)",
    rotate: "-2deg",
    top: "402px",
    left: "21px",
    iconType: "social",
    iconTone: "dark",
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
    if (card.title === "Rooms") {
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

      {typeof document !== "undefined"
        ? createPortal(
            <AnimatePresence>
              {open ? (
                <>
                  <motion.div
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 z-[90] bg-black/65"
                    exit={{ opacity: 0 }}
                    initial={{ opacity: 0 }}
                    onClick={() => setOpen(false)}
                  />

                  <motion.aside
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed inset-0 z-[100] overflow-y-auto bg-[radial-gradient(130%_100%_at_10%_0%,rgba(255,46,98,0.18),transparent_52%),radial-gradient(120%_100%_at_85%_18%,rgba(0,209,255,0.12),transparent_58%),linear-gradient(170deg,#1A0B12_0%,#230F14_62%,#140912_100%)]"
                    exit={{ opacity: 0, y: 6 }}
                    initial={{ opacity: 0, y: 12 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                  >
                    <div className="mx-auto min-h-[100dvh] w-full max-w-[405px] overflow-hidden bg-transparent px-3 pb-8 pt-1">
                      <div className="absolute left-1/2 top-0 inline-flex w-[405px] -translate-x-1/2 items-center justify-between p-6">
                        <button
                          aria-label="Close menu"
                          className="inline-flex h-12 w-12 items-center justify-center"
                          onClick={() => setOpen(false)}
                          type="button"
                        >
                          <X className="h-[18px] w-[18px] text-[#F1F5F9]" />
                        </button>
                        <div className="flex flex-1 items-center justify-center pr-12">
                          <span className="text-center text-[42px] font-bold uppercase leading-[38px] tracking-[-0.5px] text-slate-100" style={{ fontFamily: "var(--font-bebas)" }}>Menu</span>
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
                              className="absolute inline-flex w-[342px] flex-col"
                              style={{ left: card.left, top: card.top, transform: `rotate(${card.rotate})` }}
                              variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
                            >
                              <Link
                                className="relative flex flex-col rounded-[6px] p-1 shadow-[0_14px_30px_rgba(0,0,0,0.26)]"
                                href={card.href}
                                onClick={() => setOpen(false)}
                                style={{ background: card.bg }}
                              >
                                <div className={`flex h-[160px] flex-col justify-between rounded-[2px] border-2 border-dashed p-4 ${card.title === "Social" ? "border-black/10 bg-[rgba(35,15,20,0.1)]" : "border-white/30 bg-[rgba(35,15,20,0.1)]"}`}>
                                  <div className="relative flex items-start justify-between">
                                    {card.iconType === "rooms" ? (
                                      <BedDouble className="h-9 w-9 text-white" strokeWidth={1.8} />
                                    ) : null}
                                    {card.iconType === "events" ? (
                                      <Ticket className="h-9 w-9 text-white" strokeWidth={1.8} />
                                    ) : null}
                                    {card.iconType === "social" ? (
                                      <CalendarDays className="h-9 w-9 text-[#230F14]" strokeWidth={2.2} />
                                    ) : null}

                                    {card.badge ? (
                                      <StickerTag
                                        bg="#FFFFFF"
                                        className="rounded-xl border border-white/20 px-2 py-1 text-[10px] font-bold not-italic uppercase tracking-[1px]"
                                        label={card.badge}
                                        rotate="rotate-0"
                                        text="#FF2E62"
                                      />
                                    ) : card.title === "Events" ? (
                                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: card.iconBg ?? "transparent" }}>
                                        <Image alt="open" className="h-[10px] w-[10px]" src={iconArrow} style={{ filter: "brightness(1.2)" }} />
                                      </span>
                                    ) : null}
                                  </div>

                                  <div>
                                    <p className="text-[30px] font-bold uppercase leading-9 tracking-[-1.5px]" style={{ color: card.text }}>
                                      {card.title}
                                    </p>
                                    <p className="text-sm italic leading-5" style={{ color: card.mutedText }}>
                                      {card.subtitle}
                                    </p>
                                  </div>
                                </div>
                              </Link>

                              {card.title === "Rooms" ? (
                                <StickerTag className="absolute -right-1 -top-4" label="Book Now!" rotate="rotate-[12deg]" />
                              ) : null}
                            </motion.div>
                          ))}

                          <div className="absolute left-1/2 top-[600px] grid w-[346px] -translate-x-1/2 grid-cols-2 gap-[11.9px]">
                            <Link
                              className="flex h-[136px] w-full rotate-[1deg] flex-col rounded-[4px] bg-[#1E293B] p-1"
                              href="/property"
                              onClick={() => setOpen(false)}
                            >
                              <div className="flex h-full flex-col justify-between rounded-[2px] border border-[#64748B] bg-[#334155]/50 p-4">
                                <Image alt="My Stay icon" className="h-9 w-9 object-contain" src={iconMyStay} />
                                <p className="text-[20px] font-bold uppercase leading-7 text-white">My Stay</p>
                              </div>
                            </Link>

                            <Link
                              className="flex h-[136px] w-full rotate-[-2deg] flex-col rounded-[4px] bg-white p-1"
                              href="/about"
                              onClick={() => setOpen(false)}
                            >
                              <div className="flex h-full flex-col justify-between rounded-[2px] border border-[#CBD5E1] bg-[#F1F5F9] p-4">
                                <Image alt="Profile icon" className="h-9 w-9 object-contain" src={iconProfile} />
                                <p className="text-[20px] font-bold uppercase leading-7 text-[#1E293B]">Profile</p>
                              </div>
                            </Link>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </motion.aside>
                </>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </div>
  );
}
