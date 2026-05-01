"use client";

import { ShoppingBag, Sparkles } from "lucide-react";

import { BentoCard } from "@/components/guest/bento-card";
import { guestStickerTags } from "@/components/guest/guest-sticker-tags";
import { SectionBlock } from "@/components/guest/section-block";
import { StickySummary } from "@/components/guest/sticky-summary";

export function GuestAddons() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <SectionBlock
        description="The add-on catalog and cart controls will mount here once data contracts are connected."
        sticker={guestStickerTags.addons}
        title="Add-ons"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <BentoCard description="Placeholder surface for paid or complimentary stay extras." icon={ShoppingBag} title="Stay extras" />
          <BentoCard description="Placeholder surface for featured add-ons and bundled picks." icon={Sparkles} title="Featured picks" />
        </div>
      </SectionBlock>
      <StickySummary />
    </div>
  );
}
