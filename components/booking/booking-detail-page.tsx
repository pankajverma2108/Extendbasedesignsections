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
        <div className="rounded-[16px] border border-white/12 bg-[#1A1A1A] p-8 text-center text-[#99A1AF]">
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
        <div className="rounded-[16px] border border-white/12 bg-[#1A1A1A] p-8 text-center shadow-[0_20px_45px_rgba(0,0,0,0.35)]">
          <p className="text-lg font-semibold text-white">Guest sign-in required</p>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#99A1AF]">
            Sign in with the guest account used during booking, then continue to web check-in.
          </p>
          <Button className="mt-6 rounded-[10px] bg-[#F15824] px-6 text-white hover:bg-[#f36d40]" onClick={() => openAuthModal("signin")} type="button">
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
    <section className="min-h-screen bg-[#111111] pb-12 pt-24 animate-vh-fade-in md:pt-28">
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <div className="space-y-6">
          <div className="relative min-h-10">
            <Button
              asChild
              className="absolute left-0 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full border border-white/10 bg-transparent p-0 text-white shadow-none hover:bg-white/10"
              variant="ghost"
            >
              <Link aria-label="Back to my bookings" href="/bookings">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="vh-title text-center text-[26px] leading-[1.12] text-white md:text-[30px]">Checking In</h1>
          </div>
          <p className="text-center text-sm text-[#99A1AF]">{propertyName}</p>

          {errorMessage && !bookingDetail ? (
            <div className="rounded-[12px] border border-[rgba(255,106,95,0.35)] bg-[rgba(255,106,95,0.1)] px-4 py-3 text-sm text-[#ffd9d4]">
              {errorMessage}
            </div>
          ) : null}

          <div className="relative overflow-hidden rounded-[16px] border border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={`${propertyName} banner`}
              className="h-[220px] w-full object-cover md:h-[256px]"
              src={propertyGallery[0]?.src || "/images/property/hero-1.jpg"}
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4 md:p-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#99A1AF]">Reservation</p>
              <p className="mt-1 text-sm font-medium text-white">{ezeeReservationId}</p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_290px]">
            <section className="rounded-[16px] border border-white/5 bg-[#1A1A1A] p-5 md:p-8">
              <h2 className="text-[24px] font-bold leading-7 text-white">Booking Details</h2>

              <div className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6A7282]">Booking ID</p>
                  <p className="mt-1 text-base font-medium text-white break-all">{ezeeReservationId}</p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6A7282]">Status</p>
                  <div className="mt-1 inline-flex items-center gap-2 text-[#05DF72]">
                    <CheckCircle2 className="h-4 w-4" />
                    <p className="text-base font-medium">{statusLabel}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6A7282]">Check-In</p>
                  <div className="mt-1 flex items-center gap-2 text-white">
                    <CalendarDays className="h-4 w-4 text-[#99A1AF]" />
                    <p className="text-base font-medium">{formatDateLabel(checkinDate)}</p>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[#99A1AF]">
                    <Clock3 className="h-3.5 w-3.5" />
                    <p className="text-sm">{propertyGuidelines.checkIn}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6A7282]">Check-Out</p>
                  <div className="mt-1 flex items-center gap-2 text-white">
                    <CalendarDays className="h-4 w-4 text-[#99A1AF]" />
                    <p className="text-base font-medium">{formatDateLabel(checkoutDate)}</p>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[#99A1AF]">
                    <Clock3 className="h-3.5 w-3.5" />
                    <p className="text-sm">{propertyGuidelines.checkOut}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6A7282]">Guests</p>
                  <p className="mt-1 text-base font-medium text-white">
                    {totalGuests} Guest{totalGuests > 1 ? "s" : ""}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6A7282]">Rooms</p>
                  <p className="mt-1 text-base font-medium text-white">{roomSummary}</p>
                </div>
              </div>
            </section>

            <aside className="space-y-4">
              <section
                className={[
                  "rounded-[16px] border p-5",
                  checkinPending
                    ? "border-[rgba(241,88,36,0.32)] bg-[linear-gradient(135deg,#1A1A1A_0%,#25100B_100%)]"
                    : "border-[rgba(5,223,114,0.28)] bg-[linear-gradient(135deg,#1A1A1A_0%,#0f1e17_100%)]",
                ].join(" ")}
              >
                <h3 className="text-lg font-bold text-white">
                  {checkinPending ? "Web Check-in Pending" : "Web Check-in Complete"}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#D1D5DC]">
                  {checkinPending
                    ? "Smart explorers check-in early. Complete web check-in now to avoid lines at the property."
                    : "All required details are submitted. You can still review the check-in form if needed."}
                </p>
                <Button asChild className="mt-4 w-full rounded-[10px] bg-[#F15824] text-white hover:bg-[#f36d40]">
                  <Link href={checkinCtaHref}>
                    {checkinPending ? "Finish Web Check-In" : "Open Web Check-In"}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </section>

              <section className="rounded-[16px] border border-white/5 bg-[#1A1A1A] p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">Total Amount</h3>
                  <p className="text-xl font-black text-white">{formatCurrency(totalAmount)}</p>
                </div>

                <div className="mt-3 flex items-center justify-between text-sm text-[#99A1AF]">
                  <span>Paid Amount</span>
                  <span className="font-medium text-[#05DF72]">{formatCurrency(amountPaid)}</span>
                </div>

                <div className="mt-3 border-t border-white/10 pt-3 flex items-center justify-between text-sm">
                  <span className="font-bold text-white">Amount Due</span>
                  <span className="font-bold text-white">{formatCurrency(amountDue)}</span>
                </div>

                <Button asChild className="mt-4 w-full rounded-[10px] border border-white/15 bg-transparent text-white hover:bg-white/10" variant="outline">
                  <Link href={`/bookings/${encodeURIComponent(ezeeReservationId)}/confirmed`}>
                    Stay Confirmed
                  </Link>
                </Button>
              </section>

              <section className="rounded-[16px] border border-white/5 bg-[#1A1A1A] p-4 text-sm text-[#99A1AF]">
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#99A1AF]" />
                  <div>
                    <p className="font-medium text-white">{propertyName}</p>
                    <p className="mt-1">{propertyGuidelines.checkIn} check-in window</p>
                  </div>
                </div>
              </section>

              <section className="rounded-[16px] border border-white/5 bg-[#1A1A1A] p-4">
                <div className="flex items-center gap-2 text-[#99A1AF]">
                  <Wallet className="h-4 w-4" />
                  <p className="text-xs font-bold uppercase tracking-[0.12em]">Billing Status</p>
                </div>
                <p className="mt-2 text-sm text-white">
                  {amountDue === 0 ? "No pending amount for this reservation." : "Please clear due amount at the property desk."}
                </p>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
