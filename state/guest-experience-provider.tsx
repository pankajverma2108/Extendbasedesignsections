"use client";

import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

import { useGuestAuth } from "@/components/auth/guest-auth-provider";

export type GuestModalState =
  | { type: "SERVICE_REQUEST"; payload?: { serviceId?: string; title?: string } }
  | { type: "BORROW_REQUEST"; productId: string }
  | { type: "RETURN_ITEM"; productId: string }
  | { type: "EXTEND_STAY"; bookingId: string }
  | { type: "TIME_SLOT"; mode: "LATE_CHECKOUT" | "EARLY_CHECKIN" }
  | { type: "LOST_FOUND"; itemId?: string };

type GuestExperienceContextValue = {
  selectedBookingId: string | null;
  setSelectedBookingId: (bookingId: string | null) => void;
  activeModal: GuestModalState | null;
  badgeCounts: {
    cart: number;
    borrow: number;
  };
  setCartCount: (count: number) => void;
  setBorrowCount: (count: number) => void;
  paymentSyncTick: number;
  markPaymentCompleted: () => void;
};

const GuestExperienceContext = createContext<GuestExperienceContextValue | null>(null);

const CONFIRMED_BOOKING_PREFIX = "vh_confirmed_booking:";

function getLatestStoredBookingId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  let latestId: string | null = null;
  let latestCreatedAt = 0;

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key || !key.startsWith(CONFIRMED_BOOKING_PREFIX)) {
      continue;
    }

    const raw = window.localStorage.getItem(key);
    if (!raw) {
      continue;
    }

    try {
      const parsed = JSON.parse(raw) as { ezeeReservationId?: unknown; createdAt?: unknown };
      const bookingId = typeof parsed.ezeeReservationId === "string" ? parsed.ezeeReservationId : key.slice(CONFIRMED_BOOKING_PREFIX.length);
      const createdAt = typeof parsed.createdAt === "number" ? parsed.createdAt : 0;

      if (bookingId && createdAt >= latestCreatedAt) {
        latestId = bookingId;
        latestCreatedAt = createdAt;
      }
    } catch {
      // Ignore malformed snapshots from legacy sessions.
    }
  }

  return latestId;
}

export function GuestExperienceProvider({ children }: { children: ReactNode }) {
  const { guest } = useGuestAuth();
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [cartCount, setCartCountState] = useState(0);
  const [borrowCount, setBorrowCountState] = useState(0);
  const [paymentSyncTick, setPaymentSyncTick] = useState(0);

  useEffect(() => {
    if (selectedBookingId) {
      return;
    }

    const approvedBookingId =
      guest?.bookings?.find((booking) => booking.status === "APPROVED")?.ezee_reservation_id
      ?? guest?.bookings?.[0]?.ezee_reservation_id
      ?? null;

    if (approvedBookingId) {
      setSelectedBookingId(approvedBookingId);
      return;
    }

    const storedBookingId = getLatestStoredBookingId();
    if (storedBookingId) {
      setSelectedBookingId(storedBookingId);
    }
  }, [guest?.bookings, selectedBookingId]);

  const contextValue = useMemo<GuestExperienceContextValue>(
    () => ({
      selectedBookingId,
      setSelectedBookingId,
      activeModal: null,
      badgeCounts: {
        cart: cartCount,
        borrow: borrowCount,
      },
      setCartCount: (count) => setCartCountState(Math.max(0, Math.trunc(Number.isFinite(count) ? count : 0))),
      setBorrowCount: (count) => setBorrowCountState(Math.max(0, Math.trunc(Number.isFinite(count) ? count : 0))),
      paymentSyncTick,
      markPaymentCompleted: () => setPaymentSyncTick((current) => current + 1),
    }),
    [borrowCount, cartCount, paymentSyncTick, selectedBookingId],
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
