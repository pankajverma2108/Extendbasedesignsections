"use client";

import { MessageSquareText, Star } from "lucide-react";

import { BentoCard } from "@/components/guest/bento-card";
import { guestStickerTags } from "@/components/guest/guest-sticker-tags";
import { SectionBlock } from "@/components/guest/section-block";

export function GuestReview() {
  return (
    <SectionBlock
      description="The review route stays standalone and will not mutate shared cart, borrow, or request state."
      sticker={guestStickerTags.review}
      title="Leave review"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <BentoCard description="Placeholder for star ratings and stay categories." icon={Star} title="Rating" />
        <BentoCard description="Placeholder for written feedback and submission notes." icon={MessageSquareText} title="Feedback" />
      </div>
    </SectionBlock>
  );
}
