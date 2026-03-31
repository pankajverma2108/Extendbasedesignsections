"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, ChevronRight, KeyRound, MapPin, Sparkles, Users } from "lucide-react";

import { useGuestAuth } from "@/components/auth/guest-auth-provider";
import { Button } from "@/components/ui/button";
import { getConfirmedBookingSnapshot } from "@/lib/booking-session";
import { getStoredGuestToken } from "@/lib/guest-auth-api";
import { linkGuestBooking, type BookingSlotSummary, type LinkGuestBookingResponse } from "@/lib/booking-api";

import { BookingEmptyState, BookingPageShell, BookingSummaryCard, formatCurrency } from "./booking-shell";

const EMPTY_SLOTS: BookingSlotSummary[] = [];

function prettyStatus(value?: string): string {
  if (!value) {
    return "Pending";
  }

  return value.replaceAll("_", " ");
}

function slotStatusTone(status: string): string {
  if (status === "VERIFIED" || status === "PRE_VERIFIED") {
    return "border-[rgba(57,247,44,0.2)] bg-[rgba(57,247,44,0.08)] text-[var(--vh-lime)]";
  }

  if (status === "PENDING") {
    return "border-[rgba(255,204,102,0.2)] bg-[rgba(255,204,102,0.08)] text-[var(--vh-amber)]";
  }

  if (status === "REJECTED") {
    return "border-[rgba(255,76,48,0.2)] bg-[rgba(255,76,48,0.08)] text-[var(--vh-hot)]";
  }

  return "border-white/10 bg-white/5 text-white/70";
}

export function BookingDetailPage({ ezeeReservationId }: { ezeeReservationId: string }) {
  const { isAuthenticated, isRestoringSession, openAuthModal } = useGuestAuth();
  const [bookingDetail, setBookingDetail] = useState<LinkGuestBookingResponse | null>(null);
  const [snapshotFallback, setSnapshotFallback] = useState(() => getConfirmedBookingSnapshot(ezeeReservationId));
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isRestoringSession) {
      return;
    }

    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    const storedToken = getStoredGuestToken();
    if (typeof storedToken !== "string" || storedToken.length === 0) {
      setIsLoading(false);
      return;
    }
    const token = storedToken;

    let cancelled = false;

    async function loadDetail() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await linkGuestBooking(token, ezeeReservationId);
        if (!cancelled) {
          setBookingDetail(response);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to load this booking right now.");
        }
      } finally {
        if (!cancelled) {
          setSnapshotFallback(getConfirmedBookingSnapshot(ezeeReservationId));
          setIsLoading(false);
        }
      }
    }

    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [ezeeReservationId, isAuthenticated, isRestoringSession]);

  const slots = bookingDetail?.slots ?? EMPTY_SLOTS;
  const completedSlots = useMemo(
    () => slots.filter((slot) => slot.kyc_status === "PRE_VERIFIED" || slot.kyc_status === "VERIFIED").length,
    [slots],
  );

  if (isRestoringSession || isLoading) {
    return (
      <BookingPageShell
        badge="Booking Detail"
        title="Loading your booking"
        description="Pulling the linked booking, guest slots, and confirmation state from the backend."
      >
        <div className="rounded-[28px] border border-white/12 bg-[var(--vh-panel-strong)] p-8 text-center text-white/72">
          Loading booking detail...
        </div>
      </BookingPageShell>
    );
  }

  if (!isAuthenticated) {
    return (
      <BookingPageShell
        badge="Booking Detail"
        title="Sign in to open this booking"
        description="The booking detail page reads your linked booking access and guest-slot state, so it requires the guest session used during booking."
      >
        <div className="rounded-[28px] border border-white/12 bg-[var(--vh-panel-strong)] p-8 text-center shadow-[var(--vh-shadow-lg)]">
          <p className="text-lg font-semibold text-white">Guest sign-in required</p>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/70">
            Sign in with the guest account tied to this booking. If you just paid, use the same account that completed the checkout.
          </p>
          <Button className="mt-6 rounded-full px-6" onClick={() => openAuthModal("signin")} type="button">
            Sign in to continue
          </Button>
        </div>
      </BookingPageShell>
    );
  }

  if (!bookingDetail && !snapshotFallback) {
    return (
      <BookingPageShell
        badge="Booking Detail"
        title="Booking detail unavailable"
        description="The booking could not be loaded from the linked guest account, and there is no recent local confirmation snapshot to fall back to."
      >
        <BookingEmptyState
          title="This booking is not available yet"
          description={errorMessage || "Either the booking has not been linked for this guest account yet, or the backend has not returned it yet."}
          ctaHref="/bookings"
          ctaLabel="Open my bookings"
        />
      </BookingPageShell>
    );
  }

  const booking = bookingDetail?.booking;
  const roomSummary = booking?.room_type_name ?? snapshotFallback?.roomSummary ?? "Room details pending";
  const propertyName = snapshotFallback?.propertyName ?? "Vibe House";

  return (
    <BookingPageShell
      badge="Confirmed Booking"
      title={booking ? "Your booking is live" : "Your payment is confirmed"}
      description="This page combines the booking access record, slot/KYC progress, and the immediate confirmation fallback stored after a successful Razorpay verification."
    >
      {errorMessage && !bookingDetail ? (
        <div className="rounded-[22px] border border-[rgba(255,204,102,0.22)] bg-[rgba(255,204,102,0.08)] px-5 py-4 text-sm text-white/82">
          {errorMessage}
        </div>
      ) : null}

      <BookingSummaryCard
        actions={
          <div className="space-y-3">
            <Button asChild className="w-full rounded-full">
              <Link href={`/bookings/${encodeURIComponent(ezeeReservationId)}/pre-arrival`}>
                Complete pre-arrival setup
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild className="w-full rounded-full border border-white/15 bg-transparent text-white hover:bg-white/8">
              <Link href="/bookings">Back to my bookings</Link>
            </Button>
          </div>
        }
        checkIn={booking?.checkin_date ?? snapshotFallback?.checkinDate}
        checkOut={booking?.checkout_date ?? snapshotFallback?.checkoutDate}
        eyebrow="Confirmation Receipt"
        meta={
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[18px] border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-white/45">Room details</p>
              <p className="mt-2 text-lg font-semibold text-white">{roomSummary}</p>
              <p className="mt-1 text-sm text-white/62">Room number: {booking?.room_number || "Assigned closer to check-in"}</p>
            </div>
            <div className="rounded-[18px] border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-white/45">Reservation</p>
              <p className="mt-2 text-lg font-semibold text-white">{ezeeReservationId}</p>
              <p className="mt-1 text-sm text-white/62">Source: {booking?.source || "Direct web booking"}</p>
            </div>
          </div>
        }
        status={prettyStatus(booking?.status ?? "CONFIRMED")}
        title={propertyName}
        tone="ticket"
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[20px] border border-[#0f172a]/15 bg-white/45 p-4">
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-[#ff2e62]" />
              <p className="text-sm font-semibold">Guest slots</p>
            </div>
            <p className="mt-3 text-3xl font-bold">{slots.length || booking?.no_of_guests || 1}</p>
          </div>
          <div className="rounded-[20px] border border-[#0f172a]/15 bg-white/45 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-[#0f172a]" />
              <p className="text-sm font-semibold">KYC progress</p>
            </div>
            <p className="mt-3 text-3xl font-bold">{completedSlots}/{slots.length || booking?.no_of_guests || 1}</p>
          </div>
          <div className="rounded-[20px] border border-[#0f172a]/15 bg-white/45 p-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-[#0f172a]" />
              <p className="text-sm font-semibold">Amount paid</p>
            </div>
            <p className="mt-3 text-3xl font-bold">{formatCurrency(snapshotFallback?.amountPaid ?? 0)}</p>
          </div>
        </div>
      </BookingSummaryCard>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-[28px] border border-white/12 bg-[var(--vh-panel-strong)] p-6 shadow-[var(--vh-shadow-lg)]">
          <p className="vh-chip w-fit">Guest Slots</p>
          <h2 className="mt-3 font-suez text-3xl uppercase tracking-[-0.04em] text-white">Pre-arrival progress by guest</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {(slots.length > 0 ? slots : [{ slot_id: "fallback", slot_number: 1, label: "Primary guest", guest_id: null, kyc_status: "NOT_STARTED" }]).map(
              (slot: BookingSlotSummary) => (
                <div key={slot.slot_id} className="rounded-[22px] border border-white/10 bg-white/5 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-white/45">{slot.label}</p>
                      <p className="mt-2 text-xl font-semibold text-white">{slot.guest_name || "Guest details pending"}</p>
                    </div>
                    <div className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${slotStatusTone(slot.kyc_status)}`}>
                      {prettyStatus(slot.kyc_status)}
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-white/68">
                    {slot.kyc_status === "PRE_VERIFIED" || slot.kyc_status === "VERIFIED"
                      ? "This guest slot is ready for front-desk verification."
                      : "Document upload and KYC submission are still pending for this guest slot."}
                  </p>
                </div>
              ),
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-white/12 bg-[var(--vh-panel-strong)] p-6 shadow-[var(--vh-shadow-lg)]">
            <p className="vh-chip w-fit">What’s Next</p>
            <div className="mt-5 space-y-4">
              <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                <div className="flex items-start gap-3">
                  <KeyRound className="mt-1 h-4 w-4 shrink-0 text-[var(--vh-pink)]" />
                  <div>
                    <p className="font-semibold text-white">Finish KYC before arrival</p>
                    <p className="mt-1 text-sm text-white/66">Each guest slot should be submitted before check-in to keep the arrival smooth.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                <div className="flex items-start gap-3">
                  <CalendarDays className="mt-1 h-4 w-4 shrink-0 text-[var(--vh-cyan)]" />
                  <div>
                    <p className="font-semibold text-white">Room assignment sync continues after payment</p>
                    <p className="mt-1 text-sm text-white/66">Physical room and access instructions are shared once the post-payment sync is complete.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-1 h-4 w-4 shrink-0 text-[var(--vh-amber)]" />
                  <div>
                    <p className="font-semibold text-white">Property arrival</p>
                    <p className="mt-1 text-sm text-white/66">Bring the same ID documents you submit online for final on-site verification.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/12 bg-[var(--vh-panel-strong)] p-6 shadow-[var(--vh-shadow-lg)]">
            <p className="vh-chip w-fit">Recent Payment</p>
            <p className="mt-4 text-sm leading-7 text-white/72">
              {snapshotFallback
                ? `Payment ${snapshotFallback.paymentId} was recorded for ${formatCurrency(snapshotFallback.amountPaid)}.`
                : "Payment confirmation was recorded, but the local fallback snapshot is unavailable on this device."}
            </p>
          </div>
        </div>
      </div>
    </BookingPageShell>
  );
}
