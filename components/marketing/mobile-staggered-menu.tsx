"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import type { NavItem } from "@/content/types";
import iconBed from "@/src/assets/icons/Icon.svg";
import iconHome from "@/src/assets/icons/Icon-1.svg";
import iconEvent from "@/src/assets/icons/Icon-2.svg";
import iconProfile from "@/src/assets/icons/Icon-4.svg";
import iconUsers from "@/src/assets/icons/Icon-5.svg";
import iconArrow from "@/src/assets/icons/Icon-6.svg";
import iconCalendar from "@/src/assets/icons/Icon-7.svg";
import iconClose from "@/src/assets/icons/Icon-8.svg";
import iconBottomCalendar from "@/src/assets/icons/Icon-9.svg";
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
    href: "/rooms",
    title: "Rooms",
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
    iconBg: "rgba(255,255,255,0.20)",
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

type MobileStaggeredMenuProps = {
  items: NavItem[];
  pathname: string;
};

export function MobileStaggeredMenu({ items }: MobileStaggeredMenuProps) {
  const [open, setOpen] = useState(false);

  const eventLink = items.find((item) => item.href === "/events")?.href ?? "/events";
  const roomLink = items.find((item) => item.href === "/rooms")?.href ?? "/rooms";
  const aboutLink = items.find((item) => item.href === "/about")?.href ?? "/about";

  const cards = figmaMenuCards.map((card) => {
    if (card.title === "Rooms") {
      return { ...card, href: roomLink };
    }

    if (card.title === "Events") {
      return { ...card, href: eventLink };
    }

    return { ...card, href: aboutLink };
  });

  return (
    <div className="md:hidden">
      <button
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-white/25 bg-[#230F14] text-white"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

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
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div className="mx-auto h-[100dvh] w-full max-w-[405px] overflow-hidden">
                <div className="absolute left-1/2 top-0 inline-flex w-[405px] -translate-x-1/2 items-center justify-between p-6">
                  <button
                    aria-label="Close menu"
                    className="flex h-12 w-12 items-center justify-start"
                    onClick={() => setOpen(false)}
                    type="button"
                  >
                    <Image alt="Close" className="h-[17px] w-[17px]" src={iconClose} />
                  </button>
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
                              <Image alt={`${card.title} icon`} className="h-9 w-9" src={card.icon} />

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
                                  <Image alt="open" className="h-[10px] w-[10px]" src={iconArrow} />
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

                        {card.title === "Rooms" ? (
                          <StickerTag
                            className="absolute -right-1 -top-4"
                            label="Book Now!"
                            rotate="rotate-[12deg]"
                          />
                        ) : null}

                        {card.title === "Social" ? (
                          <StickerTag
                            bg="#00d1ff"
                            className="absolute left-[138px] top-[-10px] rounded-[3px] border-2 border-[var(--vh-surface-2)] px-3 py-1 text-[10px] font-bold not-italic uppercase"
                            label="Privacy"
                            rotate="rotate-[2deg]"
                            text="#0f172a"
                          />
                        ) : null}
                      </motion.div>
                    ))}

                    <div className="absolute left-[22px] top-[600px] inline-flex h-[136px] w-[361px] items-center gap-3">
                      <Link
                        className="flex h-[136px] w-[163px] rotate-[1deg] flex-col rounded-[4px] bg-[#1E293B] p-1"
                        href="/rooms"
                        onClick={() => setOpen(false)}
                      >
                        <div className="flex h-full flex-col justify-between rounded-[2px] border border-[#64748B] bg-[#334155]/50 p-4">
                          <div className="h-[15px] w-full bg-[#FF2E62]" />
                          <p className="font-biorhyme text-xl font-bold uppercase leading-7 text-white">My Stay</p>
                        </div>
                      </Link>

                      <Link
                        className="flex h-[136px] w-[163px] rotate-[-2deg] flex-col rounded-[4px] bg-white p-1"
                        href="/about"
                        onClick={() => setOpen(false)}
                      >
                        <div className="flex h-full flex-col justify-between rounded-[2px] border border-[#CBD5E1] bg-[#F1F5F9] p-4">
                          <div className="h-[24px] w-full bg-[#1E293B]" />
                          <p className="font-biorhyme text-xl font-bold uppercase leading-7 text-[#1E293B]">Profile</p>
                        </div>
                      </Link>
                    </div>
                  </motion.div>
                </div>

                <div className="absolute bottom-0 left-1/2 inline-flex w-[405px] -translate-x-1/2 items-start justify-center gap-2 border-t border-[#1E293B] bg-[#230F14] px-4 pb-8 pt-4">
                  <button className="flex flex-1 items-end justify-center" type="button">
                    <Image alt="Home" className="h-[17px] w-[22px]" src={iconHome} />
                  </button>
                  <button className="flex flex-1 items-end justify-center" type="button">
                    <Image alt="Calendar" className="h-5 w-[18px]" src={iconBottomCalendar} />
                  </button>
                  <button className="flex flex-1 items-end justify-center" type="button">
                    <Image alt="Rooms" className="h-4 w-5" src={iconBed} />
                  </button>
                  <button className="flex flex-1 items-end justify-center" type="button">
                    <Image alt="Community" className="h-[14px] w-5" src={iconUsers} />
                  </button>
                  <button className="flex flex-1 items-end justify-center" type="button">
                    <Image alt="Profile" className="h-4 w-4" src={iconProfile} />
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
