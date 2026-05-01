"use client";

import Link from "next/link";
import { BedDouble, BookOpen, CalendarPlus, ConciergeBell, DoorOpen, KeyRound, LockKeyhole, PackagePlus, PartyPopper, ShieldCheck, ShoppingBag } from "lucide-react";

import { BentoCard } from "@/components/guest/bento-card";
import { guestStickerTags } from "@/components/guest/guest-sticker-tags";
import { SectionBlock } from "@/components/guest/section-block";
import { Button } from "@/components/ui/button";

const stayCards = [
  { label: "Room", value: "Room TBA", detail: "Final room details appear after check-in.", icon: DoorOpen },
  { label: "Bed", value: "Bed TBA", detail: "Your assigned bed will stay linked to this stay.", icon: BedDouble },
  { label: "Passcode", value: "Hidden", detail: "Use the property desk for secure access details.", icon: LockKeyhole },
];

const dashboardCards = [
  {
    title: "Services",
    description: "Ask for housekeeping, maintenance, or front-desk help without leaving the guest hub.",
    href: "/guest/services",
    icon: ConciergeBell,
    sticker: guestStickerTags.services,
  },
  {
    title: "Add-ons",
    description: "Build a small cart for stay extras and review it before checkout.",
    href: "/guest/addons",
    icon: ShoppingBag,
    sticker: guestStickerTags.addons,
  },
  {
    title: "Borrow",
    description: "Request borrowable items and keep returns visible in the same place.",
    href: "/guest/borrow",
    icon: PackagePlus,
    sticker: guestStickerTags.borrow,
  },
  {
    title: "Extend",
    description: "Prepare stay extension, late checkout, or early check-in requests from one route.",
    href: "/guest/extend",
    icon: CalendarPlus,
    sticker: guestStickerTags.extend,
  },
  {
    title: "Guide",
    description: "Open the property guide for access, house rules, nearby notes, and useful details.",
    href: "/guest/guide",
    icon: BookOpen,
    sticker: guestStickerTags.guide,
  },
];

export function GuestDashboard() {
  return (
    <div className="space-y-9">
      <SectionBlock
        description="A calm control room for the stay: access details, requests, add-ons, borrowing, and guide links stay in one place."
        sticker={guestStickerTags.dashboard}
        title="Stay dashboard"
        action={
          <Button asChild className="h-10 rounded-[14px] bg-white px-4 text-[#07070a] hover:bg-white/90">
            <Link href="/guest/checkout">
              <KeyRound className="mr-2 h-4 w-4" />
              Checkout summary
            </Link>
          </Button>
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          {stayCards.map((item) => {
            const Icon = item.icon;

            return (
              <article key={item.label} className="rounded-[20px] border border-dashed border-white/22 bg-white/[0.035] p-5 shadow-[0_18px_38px_rgba(0,0,0,0.2)]">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/54">{item.label}</p>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white">
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <p className="mt-5 font-suez text-[28px] uppercase leading-none tracking-[-0.03em] text-white">{item.value}</p>
                <p className="mt-3 text-sm leading-6 text-white/60">{item.detail}</p>
              </article>
            );
          })}
        </div>
      </SectionBlock>

      <SectionBlock description="Jump into the main guest tools. These are UI routes only until API contracts are connected." title="What do you need?">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dashboardCards.map((card, index) => (
            <BentoCard
              key={card.href}
              className={index === 0 ? "lg:col-span-2" : undefined}
              ctaLabel="Open"
              description={card.description}
              href={card.href}
              icon={card.icon}
              sticker={card.sticker}
              title={card.title}
            />
          ))}
        </div>
      </SectionBlock>

      <SectionBlock description="A placeholder for live property notices, events, and useful reminders." sticker={guestStickerTags.notice} title="Notice board">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-[22px] border border-dashed border-white/22 bg-white/[0.035] p-5 shadow-[0_18px_38px_rgba(0,0,0,0.2)] md:p-6">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-white/10 bg-white/[0.05] text-white">
                <PartyPopper className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-suez text-[26px] uppercase leading-none tracking-[-0.03em] text-white">Tonight at the property</h3>
                <p className="mt-3 text-sm leading-7 text-white/64">Event and announcement cards will appear here once connected to real property data.</p>
              </div>
            </div>
          </article>

          <article className="rounded-[22px] border border-dashed border-white/22 bg-white/[0.035] p-5 shadow-[0_18px_38px_rgba(0,0,0,0.2)] md:p-6">
            <ShieldCheck className="h-5 w-5 text-white" />
            <h3 className="mt-4 font-suez text-[24px] uppercase leading-none tracking-[-0.03em] text-white">Stay status</h3>
            <p className="mt-3 text-sm leading-7 text-white/64">Booking status, request updates, and checkout reminders will share this space.</p>
          </article>
        </div>
      </SectionBlock>
    </div>
  );
}
