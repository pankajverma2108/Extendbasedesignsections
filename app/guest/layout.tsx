import type { ReactNode } from "react";

import { GuestNav } from "@/components/guest/guest-nav";
import { GuestPageShell } from "@/components/guest/guest-page-shell";
import { guestStickerTags } from "@/components/guest/guest-sticker-tags";
import { GuestExperienceProvider } from "@/state/guest-experience-provider";

export default function GuestLayout({ children }: { children: ReactNode }) {
  return (
    <GuestExperienceProvider>
      <GuestPageShell
        description="Manage the in-stay essentials from one clean guest hub."
        sticker={guestStickerTags.shell}
        title="Guest hub"
      >
        <GuestNav />
        {children}
      </GuestPageShell>
    </GuestExperienceProvider>
  );
}
