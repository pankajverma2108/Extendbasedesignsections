"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  KeyRound,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";

import { useGuestAuth } from "@/components/auth/guest-auth-provider";
import { Button } from "@/components/ui/button";
import { propertyHero, propertyGuidelines } from "@/content/rooms";
import { getConfirmedBookingSnapshot } from "@/lib/booking-session";
import { getStoredGuestToken } from "@/lib/guest-auth-api";
import { linkGuestBooking, type BookingSlotSummary, type LinkGuestBookingResponse } from "@/lib/booking-api";

import { BookingEmptyState, BookingPageShell, formatCurrency, formatDateLabel } from "./booking-shell";

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

function formatPosterDate(value?: string | null): string {
  if (!value) {
    return "TBA";
  }

  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return "TBA";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
  }).format(date).toUpperCase();
}

function getArrivalCredential(seed: string, prefix: string, size: number): string {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return `${prefix}${String(hash % 10 ** size).padStart(size, "0")}`;
}

function buildQrPattern(seed: string): boolean[] {
  const cells: boolean[] = [];
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  for (let index = 0; index < 81; index += 1) {
    hash = Math.imul(hash ^ (index + 97), 2246822519);
    const row = Math.floor(index / 9);
    const col = index % 9;
    const inCornerFinder =
      (row < 3 && col < 3) ||
      (row < 3 && col > 5) ||
      (row > 5 && col < 3);

    cells.push(inCornerFinder || ((hash >>> 29) & 1) === 1);
  }

  return cells;
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

  const accessPasscode = useMemo(() => getArrivalCredential(ezeeReservationId, "#", 6), [ezeeReservationId]);
  const lockerCode = useMemo(() => getArrivalCredential(`${ezeeReservationId}-locker`, "L-", 3), [ezeeReservationId]);
  const qrPattern = useMemo(() => buildQrPattern(ezeeReservationId), [ezeeReservationId]);

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
  const roomNumber = booking?.room_number || "Assigned at check-in";
  const totalGuests = slots.length || booking?.no_of_guests || 1;
  const amountPaid = snapshotFallback?.amountPaid ?? 0;

  return (
    <section className="vh-section min-h-screen bg-[var(--vh-section-b)] pt-24 md:pt-28">
      <div className="vh-container">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <div className="overflow-hidden rounded-[28px] border border-[rgba(255,46,98,0.14)] bg-[#230f14] shadow-[0_24px_60px_rgba(0,0,0,0.34)]">
            <div className="flex items-center justify-between border-b border-[rgba(255,46,98,0.1)] px-4 py-4 md:px-6">
              <Button asChild className="h-10 w-10 rounded-[12px] border border-white/10 bg-transparent p-0 text-white shadow-none hover:bg-white/8" variant="ghost">
                <Link href="/bookings" aria-label="Back to bookings">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div className="text-center">
                <p className="font-['Space_Grotesk'] text-lg font-bold uppercase tracking-[0.08em] text-slate-100">Booking Summary</p>
              </div>
              <Button
                className="h-10 w-10 rounded-[12px] border border-white/10 bg-transparent p-0 text-white shadow-none hover:bg-white/8"
                onClick={() => {
                  const shareUrl = `${window.location.origin}/bookings/${encodeURIComponent(ezeeReservationId)}`;
                  void navigator.clipboard.writeText(shareUrl);
                }}
                type="button"
                variant="ghost"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-8 px-4 py-6 md:px-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-start">
              <div className="space-y-6">
                <div className="relative mx-auto max-w-[342px] pt-6">
                  <div className="absolute -right-2 -top-1 rotate-[12deg] rounded-[12px] border-2 border-[#0f172a] bg-[var(--vh-pink)] px-6 py-2 shadow-[0_10px_15px_rgba(0,0,0,0.15)]">
                    <span className="font-['Space_Grotesk'] text-sm font-bold uppercase tracking-[0.08em] text-white">You&apos;re In!</span>
                  </div>

                  <div className="-rotate-1 rounded-[4px] border-2 border-[#0f172a] bg-[#facc15] p-7 text-[#0f172a] shadow-[8px_8px_0_0_#ff2e62]">
                    <div>
                      <p className="font-['Space_Grotesk'] text-xs font-bold uppercase tracking-[0.12em] text-[#0f172a]/70">Confirmation Receipt</p>
                      <div className="mt-2 font-['Space_Grotesk'] text-5xl font-black leading-[0.92]">
                        <p>{formatPosterDate(booking?.checkin_date ?? snapshotFallback?.checkinDate)}</p>
                        <p>{formatPosterDate(booking?.checkout_date ?? snapshotFallback?.checkoutDate)}</p>
                      </div>
                    </div>

                    <div className="mt-7 bg-[#0f172a] px-6 py-4 text-white [clip-path:polygon(0_4%,100%_0,95%_49%,100%_96%,0_100%,5%_52%)]">
                      <p className="text-xs uppercase tracking-[0.12em] text-white/70">Room Details</p>
                      <p className="mt-2 text-xl font-bold">{roomSummary}</p>
                      <p className="text-lg font-bold">{roomNumber}</p>
                    </div>

                    <div className="mt-6 space-y-4 border-b-2 border-[#0f172a]/20 pb-4">
                      <div className="flex items-center gap-3 border-b-2 border-[#0f172a]/20 pb-3">
                        <KeyRound className="h-5 w-5 text-[#0f172a]/60" />
                        <p className="font-['Caveat'] text-[30px] leading-none">
                          Passcode: <span className="font-bold">{accessPasscode}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-[#0f172a]/60" />
                        <p className="font-['Caveat'] text-[30px] leading-none">
                          Locker: <span className="font-bold text-[var(--vh-pink)]">{lockerCode}</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-7 flex justify-center">
                      <div className="border-4 border-[#0f172a] bg-white/55 p-3">
                        <div className="grid grid-cols-9 gap-1 bg-[#0f172a] p-3">
                          {qrPattern.map((filled, index) => (
                            <div
                              key={`${ezeeReservationId}-${index}`}
                              className={filled ? "h-3 w-3 bg-white" : "h-3 w-3 bg-[#0f172a]"}
                            />
                          ))}
                        </div>
                        <p className="mt-2 text-center font-['Space_Grotesk'] text-[10px] font-bold uppercase tracking-[0.12em] text-[#0f172a]">
                          Scan for access
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex items-start gap-2 text-sm text-[#0f172a]/80">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                      <div>
                        <p>{propertyHero.addressName}</p>
                        <p>{propertyHero.address}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <div className="rounded-[12px] border border-[rgba(255,46,98,0.3)] bg-[rgba(255,46,98,0.1)] px-4 py-2 font-['Space_Grotesk'] text-xs font-bold uppercase tracking-[0.12em] text-[var(--vh-pink)]">
                    High Energy
                  </div>
                  <div className="rounded-[12px] border border-white/20 bg-[#230f14] px-4 py-2 font-['Space_Grotesk'] text-xs font-bold uppercase tracking-[0.12em] text-white">
                    Social Meetup
                  </div>
                  <div className="rounded-[12px] border border-[#fde047] bg-[#fef9c3] px-4 py-2 font-['Space_Grotesk'] text-xs font-bold uppercase tracking-[0.12em] text-[#854d0e]">
                    Party Included
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {errorMessage && !bookingDetail ? (
                  <div className="rounded-[22px] border border-[rgba(255,204,102,0.22)] bg-[rgba(255,204,102,0.08)] px-5 py-4 text-sm text-white/82">
                    {errorMessage}
                  </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-[22px] border border-white/10 bg-white/5 p-5">
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-[var(--vh-pink)]" />
                      <p className="text-sm font-semibold text-white">Guest slots</p>
                    </div>
                    <p className="mt-3 text-3xl font-black text-white">{totalGuests}</p>
                    <p className="mt-2 text-sm text-white/60">Linked guests on this reservation.</p>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/5 p-5">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-[var(--vh-lime)]" />
                      <p className="text-sm font-semibold text-white">KYC progress</p>
                    </div>
                    <p className="mt-3 text-3xl font-black text-white">
                      {completedSlots}/{totalGuests}
                    </p>
                    <p className="mt-2 text-sm text-white/60">Guests cleared for pre-arrival.</p>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/5 p-5">
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-4 w-4 text-[var(--vh-amber)]" />
                      <p className="text-sm font-semibold text-white">Amount paid</p>
                    </div>
                    <p className="mt-3 text-3xl font-black text-white">{formatCurrency(amountPaid)}</p>
                    <p className="mt-2 text-sm text-white/60">Captured after payment verification.</p>
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_290px]">
                  <div className="rounded-[28px] border border-white/12 bg-[rgba(15,16,26,0.92)] p-6 shadow-[var(--vh-shadow-lg)]">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="font-['Space_Grotesk'] text-xs font-bold uppercase tracking-[0.12em] text-[var(--vh-pink)]">Guest Slots</p>
                        <h2 className="mt-3 font-['Space_Grotesk'] text-3xl font-bold uppercase tracking-[-0.04em] text-white">
                          Pre-arrival progress by guest
                        </h2>
                      </div>
                      <div className="rounded-[12px] border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75">
                        {prettyStatus(booking?.status ?? "CONFIRMED")}
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      {(slots.length > 0
                        ? slots
                        : [{ slot_id: "fallback", slot_number: 1, label: "Primary guest", guest_id: null, kyc_status: "NOT_STARTED" }]).map(
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
                    <div className="rounded-[28px] border border-white/12 bg-[rgba(15,16,26,0.92)] p-6 shadow-[var(--vh-shadow-lg)]">
                      <p className="font-['Space_Grotesk'] text-xs font-bold uppercase tracking-[0.12em] text-[var(--vh-pink)]">What&apos;s Next</p>
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
                              <p className="font-semibold text-white">Check-in from {propertyGuidelines.checkIn}</p>
                              <p className="mt-1 text-sm text-white/66">Room assignment and access instructions keep syncing after payment capture.</p>
                            </div>
                          </div>
                        </div>
                        <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                          <div className="flex items-start gap-3">
                            <MapPin className="mt-1 h-4 w-4 shrink-0 text-[var(--vh-amber)]" />
                            <div>
                              <p className="font-semibold text-white">{propertyName}</p>
                              <p className="mt-1 text-sm text-white/66">{propertyHero.address}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-white/12 bg-[rgba(15,16,26,0.92)] p-6 shadow-[var(--vh-shadow-lg)]">
                      <p className="font-['Space_Grotesk'] text-xs font-bold uppercase tracking-[0.12em] text-[var(--vh-pink)]">Recent Payment</p>
                      <p className="mt-4 text-sm leading-7 text-white/72">
                        {snapshotFallback
                          ? `Payment ${snapshotFallback.paymentId} was recorded for ${formatCurrency(snapshotFallback.amountPaid)}.`
                          : "Payment confirmation was recorded, but the local fallback snapshot is unavailable on this device."}
                      </p>
                      <div className="mt-6 space-y-3">
                        <Button asChild className="w-full rounded-[8px] bg-[var(--vh-pink)] py-6 text-base font-black uppercase tracking-[0.12em] shadow-[0_8px_0_0_#9a1c3b]">
                          <Link href={`/bookings/${encodeURIComponent(ezeeReservationId)}/pre-arrival`}>
                            Complete pre-arrival setup
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                        <Button asChild className="w-full rounded-[8px] border border-white/15 bg-transparent text-white hover:bg-white/8" variant="outline">
                          <Link href="/bookings">Back to my bookings</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 rounded-[24px] border border-white/10 bg-white/5 p-5 md:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-white/45">Reservation</p>
                    <p className="mt-2 text-lg font-semibold text-white">{ezeeReservationId}</p>
                    <p className="mt-1 text-sm text-white/62">Source: {booking?.source || "Direct web booking"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-white/45">Stay dates</p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {formatDateLabel(booking?.checkin_date ?? snapshotFallback?.checkinDate)} to{" "}
                      {formatDateLabel(booking?.checkout_date ?? snapshotFallback?.checkoutDate)}
                    </p>
                    <p className="mt-1 text-sm text-white/62">Bring the same ID documents for final on-site verification.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
