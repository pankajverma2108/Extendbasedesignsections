"use client";

import { Search, ShieldQuestion } from "lucide-react";

import { BentoCard } from "@/components/guest/bento-card";
import { guestStickerTags } from "@/components/guest/guest-sticker-tags";
import { SectionBlock } from "@/components/guest/section-block";

export function GuestLostFound() {
  return (
    <SectionBlock
      description="Lost item reports and found-item status cards will live here without sharing checkout state."
      sticker={guestStickerTags.lostFound}
      title="Lost & Found"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <BentoCard description="Placeholder for reporting a missing item with location and notes." icon={Search} title="Report lost item" />
        <BentoCard description="Placeholder for tracking found item status." icon={ShieldQuestion} title="Found item status" />
      </div>
    </SectionBlock>
  );
}
