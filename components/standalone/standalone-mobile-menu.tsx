"use client";

import { Suspense } from "react";

import { MobileStaggeredMenu } from "@/components/marketing/mobile-staggered-menu";

export function StandaloneMobileMenu() {
  return (
    <Suspense fallback={null}>
      <MobileStaggeredMenu isAuthenticated={false} onOpenSignIn={() => {}} />
    </Suspense>
  );
}
