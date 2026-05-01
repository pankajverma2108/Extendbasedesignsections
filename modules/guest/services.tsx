"use client";

import { ConciergeBell, Wrench } from "lucide-react";

import { BentoCard } from "@/components/guest/bento-card";
import { guestStickerTags } from "@/components/guest/guest-sticker-tags";
import { SectionBlock } from "@/components/guest/section-block";

export function GuestServices() {
  return (
    <SectionBlock
      description="Service request cards and modal entry points live here. Request creation is intentionally not wired yet."
      sticker={guestStickerTags.services}
      title="Services"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <BentoCard description="Prepare a housekeeping request flow with notes, preferred timing, and room context." icon={ConciergeBell} title="Housekeeping" />
        <BentoCard description="Prepare a maintenance request flow for room or shared-space issues." icon={Wrench} title="Maintenance" />
      </div>
    </SectionBlock>
  );
}
