"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MapPin,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { useGuestAuth } from "@/components/auth/guest-auth-provider";
import { StickerTag } from "@/components/shared/sticker-tag";
import { Button } from "@/components/ui/button";
import { propertyGallery, propertyGuidelines } from "@/content/rooms";
import { withBrandName, toBrandCheckinLink } from "@/lib/branding";
import { getClientCache, setClientCache } from "@/lib/client-cache";
import { getConfirmedBookingSnapshot } from "@/lib/booking-session";
import { getStoredGuestToken } from "@/lib/guest-auth-api";
import { linkGuestBooking, type LinkGuestBookingResponse } from "@/lib/booking-api";
import { toSafeErrorMessage } from "@/lib/ui-error";

import { BookingEmptyState, BookingPageShell, formatCurrency, formatDateLabel } from "./booking-shell";

const BOOKING_DETAIL_CACHE_TTL_MS = 1000 * 60 * 3;
const EMPTY_SLOTS: NonNullable<LinkGuestBookingResponse["slots"]> = [];

function bookingDetailCacheKey(ezeeReservationId: string): string {
  return `vh:booking-detail:${ezeeReservationId}`;
}

function prettyStatus(value?: string): string {
  if (!value) {
    return "Pending";
  }

  return value.replaceAll("_", " ");
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

  const booking = bookingDetail?.booking;
  const slots = bookingDetail?.slots ?? EMPTY_SLOTS;

  const propertyName = withBrandName(snapshotFallback?.propertyName ?? booking?.property_id);
  const checkinDate = booking?.checkin_date ?? snapshotFallback?.checkinDate;
  const checkoutDate = booking?.checkout_date ?? snapshotFallback?.checkoutDate;
  const statusLabel = prettyStatus(booking?.status ?? snapshotFallback?.status ?? "CONFIRMED");
  const roomSummary = booking?.room_type_name ?? snapshotFallback?.roomSummary ?? snapshotFallback?.roomTypeName ?? "Room details pending";

  const totalGuests = slots.length || booking?.no_of_guests || snapshotFallback?.totalGuests || 1;
  const totalSlots = Math.max(totalGuests, 1);
  const completedSlots = useMemo(
    () => (bookingDetail?.slots ?? EMPTY_SLOTS).filter((slot) => slot.kyc_status === "PRE_VERIFIED" || slot.kyc_status === "VERIFIED").length,
    [bookingDetail?.slots],
  );

  const amountPaid = snapshotFallback?.amountPaid ?? 0;
  const totalAmount = snapshotFallback?.pricing?.grandTotal ?? amountPaid;
  const amountDue = Math.max(totalAmount - amountPaid, 0);

  const checkinCtaHref = toBrandCheckinLink(ezeeReservationId);
  const checkinPending = completedSlots < totalSlots;

  if (isRestoringSession || isLoading) {
    return (
      <BookingPageShell
        badge="Checking In"
        title="Loading booking details"
        description="Preparing your booking summary and web check-in status."
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
        badge="Checking In"
        title="Sign in to open this booking"
        description="The checking-in screen is tied to the guest account linked to this reservation."
      >
        <div className="rounded-[28px] border border-white/12 bg-[var(--vh-panel-strong)] p-8 text-center shadow-[var(--vh-shadow-lg)]">
          <p className="text-lg font-semibold text-white">Guest sign-in required</p>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/70">
            Sign in with the guest account used during booking, then continue to web check-in.
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
        badge="Checking In"
        title="Booking detail unavailable"
        description="This booking could not be loaded right now."
      >
        <BookingEmptyState
          title="This booking is not available yet"
          description={errorMessage || "Please return to My Bookings and try opening this booking again."}
          ctaHref="/bookings"
          ctaLabel="Open my bookings"
        />
      </BookingPageShell>
    );
  }

  return (
    <section className="vh-section min-h-screen bg-[var(--vh-section-b)] pt-24 md:pt-28 animate-vh-fade-in">
      <div className="vh-container">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex items-center gap-3">
            <Button asChild className="h-10 w-10 rounded-[12px] border border-white/10 bg-transparent p-0 text-white shadow-none hover:bg-white/10" variant="ghost">
              <Link href="/bookings" aria-label="Back to my bookings">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="font-['Space_Grotesk'] text-2xl font-black text-white md:text-3xl">
              Checking in to {propertyName}
            </h1>
          </div>

          {errorMessage && !bookingDetail ? (
            <div className="rounded-[20px] border border-[rgba(255,204,102,0.24)] bg-[rgba(255,204,102,0.1)] px-4 py-3 text-sm text-white/82">
              {errorMessage}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-[24px] border border-white/12 bg-[var(--vh-panel-strong)] shadow-[var(--vh-shadow-lg)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={`${propertyName} banner`}
              className="h-[210px] w-full object-cover md:h-[260px]"
              src={propertyGallery[0]?.src || "/images/property/hero-1.jpg"}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="rounded-[24px] border border-white/12 bg-[var(--vh-panel-strong)] p-6 shadow-[var(--vh-shadow-lg)]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-['Space_Grotesk'] text-2xl font-bold text-white">Booking Details</h2>
                <StickerTag
                  label={statusLabel}
                  bg={checkinPending ? "#fef08a" : "#39ff14"}
                  text="#111827"
                  rotate="rotate-[-2deg]"
                  className="px-3 py-1.5 text-[10px] font-bold not-italic uppercase tracking-[0.12em]"
                />
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[14px] border border-white/10 bg-white/5 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">Booking ID</p>
                  <p className="mt-2 text-sm font-semibold break-all text-white">{ezeeReservationId}</p>
                </div>
                <div className="rounded-[14px] border border-white/10 bg-white/5 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">Room</p>
                  <p className="mt-2 text-sm font-semibold text-white">{roomSummary}</p>
                </div>

                <div className="rounded-[14px] border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 text-white/60">
                    <CalendarDays className="h-4 w-4" />
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em]">Check-In</p>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-white">{formatDateLabel(checkinDate)}</p>
                  <p className="mt-1 text-xs text-white/60">{propertyGuidelines.checkIn}</p>
                </div>
                <div className="rounded-[14px] border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 text-white/60">
                    <Clock3 className="h-4 w-4" />
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em]">Check-Out</p>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-white">{formatDateLabel(checkoutDate)}</p>
                  <p className="mt-1 text-xs text-white/60">{propertyGuidelines.checkOut}</p>
                </div>

                <div className="rounded-[14px] border border-white/10 bg-white/5 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">Guests</p>
                  <p className="mt-2 text-sm font-semibold text-white">{totalGuests} Guest{totalGuests > 1 ? "s" : ""}</p>
                </div>
                <div className="rounded-[14px] border border-white/10 bg-white/5 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">KYC Progress</p>
                  <p className="mt-2 text-sm font-semibold text-white">{completedSlots}/{totalSlots} Completed</p>
                </div>
              </div>
            </section>

            <aside className="space-y-6">
              <section className="rounded-[24px] border border-[rgba(198,40,40,0.35)] bg-[linear-gradient(135deg,rgba(198,40,40,0.24),rgba(23,17,18,0.78))] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
                <div className="flex items-center gap-2 text-white">
                  <CheckCircle2 className="h-5 w-5 text-[var(--vh-cyan)]" />
                  <p className="text-xs font-bold uppercase tracking-[0.14em]">
                    {checkinPending ? "Web Check-in Pending" : "Web Check-in Complete"}
                  </p>
                </div>
                <p className="mt-3 text-sm leading-7 text-white/85">
                  {checkinPending
                    ? "Complete web check-in now to avoid waiting at the front desk."
                    : "All required details are submitted. You can still review the check-in form if needed."}
                </p>
                <Button asChild className="mt-5 w-full rounded-[10px] bg-[var(--vh-pink)] text-white">
                  <Link href={checkinCtaHref}>
                    {checkinPending ? "Finish Web Check-In" : "Open Web Check-In"}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </section>

              <section className="rounded-[24px] border border-white/12 bg-[var(--vh-panel-strong)] p-5 shadow-[var(--vh-shadow-lg)]">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-[var(--vh-amber)]" />
                  <h3 className="font-['Space_Grotesk'] text-lg font-bold uppercase text-white">Payment Summary</h3>
                </div>
                <div className="mt-4 space-y-3 text-sm text-white/82">
                  <div className="flex items-center justify-between">
                    <span>Total amount</span>
                    <span className="font-semibold text-white">{formatCurrency(totalAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Paid amount</span>
                    <span className="font-semibold text-[var(--vh-lime)]">{formatCurrency(amountPaid)}</span>
                  </div>
                  <div className="border-t border-white/12 pt-3 flex items-center justify-between">
                    <span className="font-semibold text-white">Amount due</span>
                    <span className="font-semibold text-white">{formatCurrency(amountDue)}</span>
                  </div>
                </div>

                <Button asChild className="mt-5 w-full rounded-[10px] border border-white/15 bg-transparent text-white hover:bg-white/10" variant="outline">
                  <Link href={`/bookings/${encodeURIComponent(ezeeReservationId)}/confirmed`}>
                    Stay Confirmed
                  </Link>
                </Button>
              </section>

              <section className="rounded-[24px] border border-white/12 bg-[var(--vh-panel-strong)] p-5 shadow-[var(--vh-shadow-lg)]">
                <div className="flex items-start gap-2 text-white/80">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--vh-cyan)]" />
                  <p className="text-sm leading-6">{propertyName}</p>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
