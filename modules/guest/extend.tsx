"use client";

import { CalendarClock, CalendarPlus, Moon } from "lucide-react";

import { BentoCard } from "@/components/guest/bento-card";
import { guestStickerTags } from "@/components/guest/guest-sticker-tags";
import { SectionBlock } from "@/components/guest/section-block";

export function GuestExtend() {
  return (
    <SectionBlock
      description="Date and time request cards live here for extending a stay, late checkout, and early check-in."
      sticker={guestStickerTags.extend}
      title="Extend stay"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <BentoCard description="Placeholder for extending the checkout date." icon={CalendarPlus} title="Extend stay" />
        <BentoCard description="Placeholder for late checkout timing requests." icon={Moon} title="Late checkout" />
        <BentoCard description="Placeholder for early check-in timing requests." icon={CalendarClock} title="Early check-in" />
      </div>
    </SectionBlock>
  );
}
