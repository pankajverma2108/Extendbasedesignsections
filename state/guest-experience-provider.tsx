"use client";

import { createContext, type ReactNode, useContext, useMemo } from "react";

export type GuestModalState =
  | { type: "SERVICE_REQUEST"; payload?: { serviceId?: string; title?: string } }
  | { type: "BORROW_REQUEST"; productId: string }
  | { type: "RETURN_ITEM"; productId: string }
  | { type: "EXTEND_STAY"; bookingId: string }
  | { type: "TIME_SLOT"; mode: "LATE_CHECKOUT" | "EARLY_CHECKIN" }
  | { type: "LOST_FOUND"; itemId?: string };

type GuestExperienceContextValue = {
  selectedBookingId: string | null;
  activeModal: GuestModalState | null;
  badgeCounts: {
    cart: number;
    borrow: number;
  };
};

const GuestExperienceContext = createContext<GuestExperienceContextValue | null>(null);

export function GuestExperienceProvider({ children }: { children: ReactNode }) {
  const contextValue = useMemo<GuestExperienceContextValue>(
    () => ({
      selectedBookingId: null,
      activeModal: null,
      badgeCounts: {
        cart: 0,
        borrow: 0,
      },
    }),
    [],
  );

  return <GuestExperienceContext.Provider value={contextValue}>{children}</GuestExperienceContext.Provider>;
}

export function useGuestExperience() {
  const contextValue = useContext(GuestExperienceContext);

  if (!contextValue) {
    throw new Error("useGuestExperience must be used within GuestExperienceProvider.");
  }

  return contextValue;
}
