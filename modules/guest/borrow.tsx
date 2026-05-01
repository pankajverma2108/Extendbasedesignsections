"use client";

import { PackageCheck, PackagePlus } from "lucide-react";

import { BentoCard } from "@/components/guest/bento-card";
import { guestStickerTags } from "@/components/guest/guest-sticker-tags";
import { SectionBlock } from "@/components/guest/section-block";
import { StickySummary } from "@/components/guest/sticky-summary";

export function GuestBorrow() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <SectionBlock
        description="Borrowable item cards, return reminders, and return actions will live here."
        sticker={guestStickerTags.borrow}
        title="Borrow"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <BentoCard description="Placeholder for towels, adapters, games, and other borrowable items." icon={PackagePlus} title="Borrow items" />
          <BentoCard description="Placeholder for active borrowed items and return state." icon={PackageCheck} title="Return flow" />
        </div>
      </SectionBlock>
      <StickySummary title="Borrow summary" />
    </div>
  );
}
