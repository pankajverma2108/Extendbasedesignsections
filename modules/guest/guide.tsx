"use client";

import { BookOpen, MapPin } from "lucide-react";

import { BentoCard } from "@/components/guest/bento-card";
import { guestStickerTags } from "@/components/guest/guest-sticker-tags";
import { SectionBlock } from "@/components/guest/section-block";

export function GuestGuide() {
  return (
    <SectionBlock
      description="Property rules, directions, access notes, and local recommendations will be organized here."
      sticker={guestStickerTags.guide}
      title="Property guide"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <BentoCard description="Placeholder for house rules, access, timings, and property basics." icon={BookOpen} title="Guide basics" />
        <BentoCard description="Placeholder for nearby places, directions, and property contact notes." icon={MapPin} title="Around here" />
      </div>
    </SectionBlock>
  );
}
