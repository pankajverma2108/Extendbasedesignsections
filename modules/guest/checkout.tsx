"use client";

import { ClipboardCheck, ReceiptText } from "lucide-react";

import { BentoCard } from "@/components/guest/bento-card";
import { guestStickerTags } from "@/components/guest/guest-sticker-tags";
import { SectionBlock } from "@/components/guest/section-block";
import { StickySummary } from "@/components/guest/sticky-summary";

export function GuestCheckout() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <SectionBlock
        description="Checkout will aggregate cart, borrow, service, and timing drafts later. This pass only creates the UI foundation."
        sticker={guestStickerTags.checkout}
        title="Checkout summary"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <BentoCard description="Placeholder for the final action list before submission." icon={ClipboardCheck} title="Actions" />
          <BentoCard description="Placeholder for client-side preview totals and backend-confirmed totals later." icon={ReceiptText} title="Totals" />
        </div>
      </SectionBlock>
      <StickySummary ctaLabel="Submit disabled" title="Checkout preview" />
    </div>
  );
}
