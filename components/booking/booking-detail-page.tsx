"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Download,
  KeyRound,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { useGuestAuth } from "@/components/auth/guest-auth-provider";
import { StickerTag } from "@/components/shared/sticker-tag";
import { Button } from "@/components/ui/button";
import { propertyHero, propertyGuidelines } from "@/content/rooms";
import { withBrandName, toBrandCheckinLink } from "@/lib/branding";
import { getClientCache, setClientCache } from "@/lib/client-cache";
import { getConfirmedBookingSnapshot } from "@/lib/booking-session";
import { getStoredGuestToken } from "@/lib/guest-auth-api";
import { linkGuestBooking, type BookingSlotSummary, type LinkGuestBookingResponse } from "@/lib/booking-api";
import { toSafeErrorMessage } from "@/lib/ui-error";

import { BookingEmptyState, BookingPageShell, formatCurrency } from "./booking-shell";

const EMPTY_SLOTS: BookingSlotSummary[] = [];
const BOOKING_DETAIL_CACHE_TTL_MS = 1000 * 60 * 3;

function bookingDetailCacheKey(ezeeReservationId: string): string {
  return `vh:booking-detail:${ezeeReservationId}`;
}

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
    if (!errorMessage) {
      return;
    }

    toast.error("Booking details unavailable", {
      description: errorMessage,
    });
  }, [errorMessage]);

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
    const cacheKey = bookingDetailCacheKey(ezeeReservationId);

    let cancelled = false;

    async function loadDetail() {
      setIsLoading(true);
      setErrorMessage(null);

      const cachedDetail = getClientCache<LinkGuestBookingResponse>(cacheKey, BOOKING_DETAIL_CACHE_TTL_MS);
      if (cachedDetail && !cancelled) {
        setBookingDetail(cachedDetail);
        setIsLoading(false);
      }

      try {
        const response = await linkGuestBooking(token, ezeeReservationId);
        if (!cancelled) {
          setBookingDetail(response);
          setClientCache(cacheKey, response);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(toSafeErrorMessage(error, "Unable to load this booking right now."));
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
  const qrPattern = useMemo(() => buildQrPattern(ezeeReservationId), [ezeeReservationId]);

  if (isRestoringSession || isLoading) {
    return (
      <BookingPageShell
        badge="Booking Detail"
        title="Loading your booking"
        description="Pulling your linked booking, guest slots, and confirmation state."
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
          description={errorMessage || "Either the booking has not been linked for this guest account yet, or it is still being prepared."}
          ctaHref="/bookings"
          ctaLabel="Open my bookings"
        />
      </BookingPageShell>
    );
  }

  const booking = bookingDetail?.booking;
  const roomSummary = booking?.room_type_name ?? snapshotFallback?.roomSummary ?? "Room details pending";
  const propertyName = withBrandName(snapshotFallback?.propertyName ?? booking?.property_id);
  const roomNumber = booking?.room_number || "Assigned at check-in";
  const totalGuests = slots.length || booking?.no_of_guests || 1;
  const amountPaid = snapshotFallback?.amountPaid ?? 0;
  const snapshotRooms = snapshotFallback?.rooms ?? [];
  const snapshotAddons = snapshotFallback?.addons ?? [];
  const snapshotPricing = snapshotFallback?.pricing;
  const primaryGuest = snapshotFallback?.primaryGuest;
  const additionalGuests = snapshotFallback?.additionalGuests ?? [];
  const hasSnapshotPanels = Boolean(primaryGuest || snapshotRooms.length > 0 || snapshotAddons.length > 0);

  return (
    <section className="vh-section min-h-screen bg-[var(--vh-section-b)] pt-24 md:pt-28 animate-vh-fade-in">
      <div className="mx-auto w-full max-w-[1400px] px-4 md:px-6 lg:px-10">
        <div className="flex flex-col gap-8">
          <div className="animate-vh-slide-up overflow-hidden rounded-[28px] border border-[rgba(151,135,243,0.14)] bg-[var(--vh-section-a)] shadow-[0_24px_60px_rgba(0,0,0,0.34)]">
            <div className="flex items-center justify-between border-b border-[rgba(151,135,243,0.1)] bg-[rgba(151,135,243,0.03)] px-4 py-4 backdrop-blur-md md:px-6">
              <Button asChild className="h-10 w-10 rounded-[12px] border border-white/10 bg-transparent p-0 text-white shadow-none hover:bg-white/10 hover:border-white/20 transition-all duration-300" variant="ghost">
                <Link href="/bookings" aria-label="Back to bookings">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div className="text-center">
                <p className="font-['Space_Grotesk'] text-lg font-bold uppercase tracking-[0.08em] text-slate-100">Booking Summary</p>
              </div>
              <Button
                className="rounded-full border border-white/12 bg-white/5 px-4 text-xs font-bold uppercase tracking-[0.14em] text-white/80 hover:bg-white/10"
                onClick={() => {
                  const shareUrl = `${window.location.origin}/bookings/${encodeURIComponent(ezeeReservationId)}`;
                  void navigator.clipboard.writeText(shareUrl);
                  toast.success("Booking link copied", {
                    description: "Share it with your travel crew.",
                  });
                }}
                type="button"
                variant="ghost"
              >
                Copy link
              </Button>
            </div>

            <div className="grid gap-8 px-4 py-6 md:px-6 lg:grid-cols-[minmax(0,390px)_minmax(0,1fr)] lg:items-start">
              <div className="space-y-6">
                <div className="relative mx-auto max-w-[342px] pt-6 group">
                  <div className="absolute -right-2 -top-1 rotate-[12deg] rounded-[12px] border-2 border-[var(--vh-surface-2)] bg-[var(--vh-pink)] px-6 py-2 shadow-[0_10px_15px_rgba(0,0,0,0.25)] z-50 transition-transform duration-300 group-hover:rotate-[8deg] group-hover:scale-105">
                    <span className="font-['Space_Grotesk'] text-sm font-bold uppercase tracking-[0.08em] text-white">You&apos;re In!</span>
                  </div>

                  <div className="-rotate-1 rounded-[16px] border-2 border-[var(--vh-border)] bg-[var(--vh-ice)] p-7 text-[var(--vh-surface-2)] shadow-[8px_8px_0_0_var(--vh-pink)] transition-all duration-300 group-hover:-rotate-2 group-hover:shadow-[12px_12px_0_0_var(--vh-pink)] group-hover:-translate-y-1">
                    <div>
                      <p className="font-['Space_Grotesk'] text-xs font-bold uppercase tracking-[0.12em] text-[var(--vh-surface)]/70">Confirmation Receipt</p>
                      <p className="mt-2 break-all text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--vh-surface)]/55">Reservation {ezeeReservationId}</p>
                      <div className="mt-2 font-['Space_Grotesk'] text-4xl lg:text-5xl font-black leading-[0.92] text-[var(--vh-surface)]">
                        <p>{formatPosterDate(booking?.checkin_date ?? snapshotFallback?.checkinDate)}</p>
                        <p>{formatPosterDate(booking?.checkout_date ?? snapshotFallback?.checkoutDate)}</p>
                      </div>
                    </div>

                    <div className="mt-7 bg-[var(--vh-surface)] px-6 py-5 text-white rounded-[12px] shadow-inner relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-[var(--vh-pink)]"></div>
                      <p className="text-xs uppercase tracking-[0.12em] text-white/50">Room Details</p>
                      <p className="mt-2 text-xl font-bold tracking-tight">{roomSummary}</p>
                      <p className="text-lg font-bold text-white/80">{roomNumber}</p>
                    </div>

                    <div className="mt-6 rounded-[14px] border border-dashed border-[rgba(45,39,75,0.16)] bg-white/55 px-4 py-3 text-sm text-[var(--vh-surface-2)]/78">
                      Keep this receipt handy. The front desk can verify the stay from the booking ID above.
                    </div>

                    <div className="mt-7 flex justify-center">
                      <div className="border-4 border-[var(--vh-surface-2)] bg-white p-3 rounded-xl shadow-sm hover:scale-105 transition-transform duration-300">
                        <div className="grid grid-cols-9 gap-1 bg-[var(--vh-surface-2)] p-3 rounded-md">
                          {qrPattern.map((filled, index) => (
                            <div
                              key={`${ezeeReservationId}-${index}`}
                              className={filled ? "h-3 w-3 bg-white rounded-sm" : "h-3 w-3 bg-[var(--vh-surface-2)]"}
                            />
                          ))}
                        </div>
                        <p className="mt-2 text-center font-['Space_Grotesk'] text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--vh-surface-2)]">
                          Scan for room access
                        </p>
                        <p className="text-center font-['Space_Grotesk'] text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--vh-surface-2)]/70">
                          Access code {accessPasscode}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex items-start gap-2 text-sm text-[var(--vh-surface)]/80">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                      <div>
                        <p>{propertyHero.addressName}</p>
                        <p>{propertyHero.address}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <StickerTag bg="#fef08a" className="px-4 py-2 text-[11px] font-bold not-italic uppercase tracking-[0.12em]" label="Bring the whole gang" rotate="rotate-[-2deg]" text="#0f172a" />
                  <StickerTag bg="#39ff14" className="px-4 py-2 text-[11px] font-bold not-italic uppercase tracking-[0.12em]" label="KYC before chaos" rotate="rotate-[1deg]" text="#0f172a" />
                  <StickerTag bg="#00d1ff" className="px-4 py-2 text-[11px] font-bold not-italic uppercase tracking-[0.12em]" label="Scan, stay, repeat" rotate="rotate-[-1deg]" text="#0f172a" />
                </div>
              </div>

              <div className="space-y-6">
                {errorMessage && !bookingDetail ? (
                  <div className="rounded-[22px] border border-[rgba(255,204,102,0.22)] bg-[rgba(255,204,102,0.08)] px-5 py-4 text-sm text-white/82">
                    {errorMessage}
                  </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-[22px] border border-white/10 bg-white/5 p-5 hover:-translate-y-1 hover:border-[rgba(151,135,243,0.4)] hover:bg-[rgba(151,135,243,0.05)] transition-all duration-300 shadow-sm hover:shadow-[0_10px_30px_-5px_rgba(151,135,243,0.2)]">
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-[var(--vh-cyan)]" />
                      <p className="text-sm font-semibold text-white tracking-wide">Guest slots</p>
                    </div>
                    <p className="mt-4 text-4xl font-black text-white">{totalGuests}</p>
                    <p className="mt-2 text-xs font-medium uppercase tracking-widest text-white/50">Linked guests</p>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/5 p-5 hover:-translate-y-1 hover:border-[rgba(151,135,243,0.4)] hover:bg-[rgba(151,135,243,0.05)] transition-all duration-300 shadow-sm hover:shadow-[0_10px_30px_-5px_rgba(151,135,243,0.2)]">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-[var(--vh-lime)]" />
                      <p className="text-sm font-semibold text-white tracking-wide">KYC progress</p>
                    </div>
                    <p className="mt-4 text-4xl font-black text-white">
                      {completedSlots}<span className="text-white/30 text-2xl">/{totalGuests}</span>
                    </p>
                    <p className="mt-2 text-xs font-medium uppercase tracking-widest text-white/50">Cleared</p>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/5 p-5 hover:-translate-y-1 hover:border-[rgba(151,135,243,0.4)] hover:bg-[rgba(151,135,243,0.05)] transition-all duration-300 shadow-sm hover:shadow-[0_10px_30px_-5px_rgba(151,135,243,0.2)]">
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-4 w-4 text-[var(--vh-pink)]" />
                      <p className="text-sm font-semibold text-white tracking-wide">Amount paid</p>
                    </div>
                    <p className="mt-4 text-3xl font-black text-white">{formatCurrency(amountPaid)}</p>
                    <p className="mt-2 text-xs font-medium uppercase tracking-widest text-white/50">Captured</p>
                  </div>
                </div>

                <div className={`grid gap-6 ${hasSnapshotPanels ? "xl:grid-cols-[minmax(0,1fr)_290px_290px]" : "xl:grid-cols-[minmax(0,1fr)_290px]"}`}>
                  <div className="rounded-[28px] border border-white/12 bg-[var(--vh-panel-strong)] p-6 shadow-[var(--vh-shadow-lg)] backdrop-blur-md">
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

                  {(primaryGuest || snapshotRooms.length > 0 || snapshotAddons.length > 0) ? (
                    <div className="space-y-6">
                      {primaryGuest ? (
                        <div className="rounded-[28px] border border-white/12 bg-[var(--vh-panel-strong)] p-6 shadow-[var(--vh-shadow-lg)] backdrop-blur-md">
                          <p className="font-['Space_Grotesk'] text-xs font-bold uppercase tracking-[0.12em] text-[var(--vh-pink)]">Guest details</p>
                          <div className="mt-4 space-y-2 text-sm text-white/80">
                            <p className="font-semibold text-white">
                              {`${primaryGuest.firstName} ${primaryGuest.lastName}`.trim() || "Primary guest"}
                            </p>
                            <p>{primaryGuest.email || "-"}</p>
                            <p>{primaryGuest.phone || "-"}</p>
                          </div>
                          {additionalGuests.length > 0 ? (
                            <div className="mt-4 border-t border-white/10 pt-4">
                              <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/60">Additional guests</p>
                              <div className="mt-3 space-y-2 text-sm text-white/75">
                                {additionalGuests.map((guest, index) => (
                                  <p key={`summary-additional-${index}`}>
                                    {guest.name || `Guest ${index + 2}`}{guest.phone ? ` - ${guest.phone}` : ""}
                                  </p>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : null}

                      {(snapshotRooms.length > 0 || snapshotAddons.length > 0) ? (
                        <div className="rounded-[28px] border border-white/12 bg-[var(--vh-panel-strong)] p-6 shadow-[var(--vh-shadow-lg)] backdrop-blur-md">
                          <p className="font-['Space_Grotesk'] text-xs font-bold uppercase tracking-[0.12em] text-[var(--vh-pink)]">Booking charges</p>
                          <div className="mt-4 space-y-3">
                            {snapshotRooms.map((room) => (
                              <div key={`summary-room-${room.roomTypeId}`} className="flex items-start justify-between gap-3 text-sm text-white/82">
                                <div>
                                  <p className="font-semibold text-white">{room.roomTypeName}</p>
                                  <p className="text-xs text-white/55">{formatCurrency(room.pricePerNight)} x {room.quantity}</p>
                                </div>
                                <p className="font-semibold text-white">{formatCurrency(room.lineTotal)}</p>
                              </div>
                            ))}
                            {snapshotAddons.map((addon) => (
                              <div key={`summary-addon-${addon.productId}`} className="flex items-start justify-between gap-3 border-t border-white/10 pt-3 text-sm text-white/82">
                                <div>
                                  <p className="font-semibold text-white">{addon.productName}</p>
                                  <p className="text-xs text-white/55">{formatCurrency(addon.unitPrice)} x {addon.quantity}</p>
                                </div>
                                <p className="font-semibold text-white">{formatCurrency(addon.lineTotal)}</p>
                              </div>
                            ))}
                          </div>
                          {snapshotPricing ? (
                            <div className="mt-4 space-y-1 border-t border-white/10 pt-4 text-sm text-white/80">
                              <div className="flex items-center justify-between">
                                <p>Room subtotal</p>
                                <p>{formatCurrency(snapshotPricing.subtotalRooms)}</p>
                              </div>
                              <div className="flex items-center justify-between">
                                <p>Add-on subtotal</p>
                                <p>{formatCurrency(snapshotPricing.subtotalAddons)}</p>
                              </div>
                              <div className="flex items-center justify-between">
                                <p>Taxes</p>
                                <p>{formatCurrency(snapshotPricing.taxes)}</p>
                              </div>
                              <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-3">
                                <p className="font-semibold text-white">Grand total</p>
                                <p className="font-semibold text-[#00f0ff]">{formatCurrency(snapshotPricing.grandTotal)}</p>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="space-y-6">
                    <div className="rounded-[28px] border border-white/12 bg-[var(--vh-panel-strong)] p-6 shadow-[var(--vh-shadow-lg)] backdrop-blur-md hover:border-white/20 transition-all duration-300">
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
                              <p className="mt-1 text-sm text-white/66">Room assignment and access instructions continue updating after payment capture.</p>
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

                    <div className="rounded-[28px] border border-white/12 bg-[var(--vh-panel-strong)] p-6 shadow-[var(--vh-shadow-lg)] backdrop-blur-md">
                      <p className="font-['Space_Grotesk'] text-xs font-bold uppercase tracking-[0.12em] text-[var(--vh-pink)]">Recent Payment</p>
                      <p className="mt-4 text-sm leading-7 text-white/72">
                        {snapshotFallback
                          ? `Payment ${snapshotFallback.paymentId} was recorded for ${formatCurrency(snapshotFallback.amountPaid)}.`
                          : "Payment confirmation was recorded, but recent payment details are unavailable on this device."}
                      </p>
                      <div className="mt-6 space-y-3">
                        <Button asChild className="w-full rounded-[12px] bg-[var(--vh-pink)] py-6 h-auto whitespace-normal text-center text-sm md:text-base font-black uppercase tracking-[0.12em] shadow-[0_4px_0_0_var(--vh-border)] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_var(--vh-border)] transition-all duration-200 print:hidden">
                          <Link href={toBrandCheckinLink(ezeeReservationId)} className="flex-col md:flex-row gap-2">
                            <span>Start web check-in</span>
                            <ChevronRight className="h-5 w-5" />
                          </Link>
                        </Button>
                        <Button asChild className="w-full rounded-[8px] border border-white/15 bg-transparent text-white hover:bg-white/8 print:hidden" variant="outline">
                          <Link href={`/bookings/${encodeURIComponent(ezeeReservationId)}/confirmed`}>Open confirmation page</Link>
                        </Button>
                        <Button onClick={() => window.print()} className="w-full rounded-[8px] border border-[var(--vh-cyan)]/30 bg-[rgba(234,239,254,0.05)] text-[var(--vh-cyan)] hover:bg-[rgba(234,239,254,0.1)] transition-all duration-200 print:hidden" variant="outline">
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF Invoice
                        </Button>
                        <Button asChild className="w-full rounded-[8px] border border-white/15 bg-transparent text-white hover:bg-white/8 print:hidden" variant="outline">
                          <Link href="/bookings">Back to my bookings</Link>
                        </Button>
                      </div>
                    </div>
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
