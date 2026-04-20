"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";

import { useGuestAuth } from "@/components/auth/guest-auth-provider";
import { StickerTag } from "@/components/shared/sticker-tag";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { locationMap, propertyGuidelines } from "@/content/rooms";
import { linkGuestBooking, type BookingSlotSummary, type LinkGuestBookingResponse } from "@/lib/booking-api";
import { withBrandName, toAbsoluteBrandCheckinLink, toBrandCheckinLink } from "@/lib/branding";
import { getConfirmedBookingSnapshot } from "@/lib/booking-session";
import { getStoredGuestToken } from "@/lib/guest-auth-api";
import { toSafeErrorMessage } from "@/lib/ui-error";

import { BookingEmptyState, BookingPageShell, formatCurrency, formatDateLabel, getNightCount } from "./booking-shell";

const EMPTY_SLOTS: BookingSlotSummary[] = [];

function isKycCompletedStatus(status?: string): boolean {
  const normalized = (status || "").toUpperCase();
  return normalized === "PRE_VERIFIED" || normalized === "VERIFIED";
}

function toStatusLabel(status?: string): string {
  if (!status) {
    return "Pending";
  }
  return status.replaceAll("_", " ");
}

export function BookingConfirmedPage({ ezeeReservationId }: { ezeeReservationId: string }) {
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

    const token = getStoredGuestToken();
    if (typeof token !== "string" || token.length === 0) {
      setIsLoading(false);
      return;
    }
    const authToken = token;

    let cancelled = false;

    async function loadConfirmation() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await linkGuestBooking(authToken, ezeeReservationId);
        if (!cancelled) {
          setBookingDetail(response);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(toSafeErrorMessage(error, "Unable to load this confirmation right now."));
        }
      } finally {
        if (!cancelled) {
          setSnapshotFallback(getConfirmedBookingSnapshot(ezeeReservationId));
          setIsLoading(false);
        }
      }
    }

    void loadConfirmation();

    return () => {
      cancelled = true;
    };
  }, [ezeeReservationId, isAuthenticated, isRestoringSession]);

  const slots = bookingDetail?.slots ?? EMPTY_SLOTS;
  const booking = bookingDetail?.booking;

  const propertyName = withBrandName(snapshotFallback?.propertyName ?? booking?.property_id ?? locationMap.title);
  const checkinDate = booking?.checkin_date ?? snapshotFallback?.checkinDate;
  const checkoutDate = booking?.checkout_date ?? snapshotFallback?.checkoutDate;
  const totalGuests = slots.length || booking?.no_of_guests || snapshotFallback?.totalGuests || 1;
  const roomSummary = booking?.room_type_name ?? snapshotFallback?.roomSummary ?? snapshotFallback?.roomTypeName ?? "Room details pending";

  const checkinLink = toBrandCheckinLink(ezeeReservationId);
  const absoluteCheckinLink = toAbsoluteBrandCheckinLink(ezeeReservationId);

  const guests = useMemo(() => {
    if (slots.length > 0) {
      return slots;
    }

    return [
      {
        slot_id: "primary",
        slot_number: 1,
        label: "Primary guest",
        guest_id: null,
        guest_name: snapshotFallback?.primaryGuest
          ? `${snapshotFallback.primaryGuest.firstName} ${snapshotFallback.primaryGuest.lastName}`.trim()
          : "Guest",
        kyc_status: "PENDING",
      } satisfies BookingSlotSummary,
    ];
  }, [slots, snapshotFallback?.primaryGuest]);

  const hasCompletedCheckin = useMemo(() => guests.some((slot) => isKycCompletedStatus(slot.kyc_status)), [guests]);

  const primaryGuestName = useMemo(() => {
    const namedGuest = guests.find((slot) => Boolean(slot.guest_name?.trim()))?.guest_name?.trim();
    return namedGuest || "Guest";
  }, [guests]);

  const guestsDisplayLabel = totalGuests > 1 ? `${primaryGuestName} & rest` : primaryGuestName;

  if (isRestoringSession || isLoading) {
    return (
      <BookingPageShell
        title="Stay confirmation"
        sectionClassName="bg-[#07070a]"
      >
        <div aria-busy="true" aria-live="polite" className="space-y-4" role="status">
          <span className="sr-only">Loading booking confirmation details.</span>
          <Skeleton className="mx-auto h-8 w-72 bg-white/10" />
          <Skeleton className="mx-auto h-4 w-full max-w-xl bg-white/10" />
          <Skeleton className="h-24 w-full bg-white/10" />
          <Skeleton className="h-40 w-full bg-white/10" />
        </div>
      </BookingPageShell>
    );
  }

  if (!isAuthenticated) {
    return (
      <BookingPageShell
        title="Sign in to view confirmation"
        description="This screen is available for the guest account linked to this booking."
        sectionClassName="bg-[#07070a]"
      >
        <div className="rounded-[16px] border border-white/12 bg-[#1A1A1A] p-8 text-center shadow-[0_20px_45px_rgba(0,0,0,0.35)]">
          <p className="text-lg font-semibold text-white">Guest sign-in required</p>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#99A1AF]">
            Sign in with your booking account to open your confirmation and co-guest sharing tools.
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
        title="Confirmation unavailable"
        description="We could not open a recent confirmation snapshot for this booking."
        sectionClassName="bg-[#07070a]"
      >
        <BookingEmptyState
          title="No confirmation found"
          description={errorMessage || "Please reopen your booking details and try again."}
          ctaHref="/bookings"
          ctaLabel="Open my bookings"
        />
      </BookingPageShell>
    );
  }

  return (
    <section className="min-h-screen bg-[#07070a] pb-16 pt-24 animate-vh-fade-in md:pt-28">
      <div className="mx-auto w-full max-w-[600px] px-4 py-8">
        <div className="space-y-6">
          <header className="text-center">
            <div className="flex justify-center">
              <StickerTag
                bg="#f9cb37"
                className="px-3 py-1.5 text-[11px] font-bold not-italic uppercase tracking-[0.12em]"
                label="Reservation Locked"
                rotate="rotate-[-2deg]"
                text="#111111"
              />
            </div>
            <h1 className="vh-title text-center text-[26px] leading-[1.12] text-white md:text-[30px]">
              Bags packed. Vibes ready. <br />
              <span className="text-[var(--vh-pink)]">{propertyName}</span> is ready for you.
            </h1>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-white/72">
              Stay confirmed. Wrap web check-in, skip the desk line, walk straight in.
            </p>
          </header>

          <section className="space-y-4 rounded-[16px] border border-white/12 bg-[#0d0d11] p-5 md:p-6">
            <h2 className="text-[22px] font-bold text-white">Co-guest check-in</h2>
            <p className="text-sm leading-7 text-white/72">Share this once in the group. Your crew gets direct web check-in access.</p>

            <a
              className="block break-all text-sm font-semibold text-[var(--vh-cyan)] underline decoration-[var(--vh-cyan)]/35 underline-offset-4 hover:text-white"
              href={absoluteCheckinLink}
              rel="noreferrer"
              target="_blank"
            >
              {absoluteCheckinLink}
            </a>

            <div className="flex flex-wrap gap-3">
              <Button
                className="rounded-full bg-[var(--vh-pink)] px-5 text-white hover:bg-[var(--vh-pink-soft)]"
                onClick={() => {
                  void navigator.clipboard.writeText(absoluteCheckinLink);
                  toast.success("Link copied", {
                    description: "Share it with your co-guests.",
                  });
                }}
                type="button"
              >
                <Copy className="mr-2 h-4 w-4" />
                Share Link
              </Button>

              <Button asChild className="rounded-full border border-white/15 bg-transparent px-5 text-white hover:bg-white/10" variant="outline">
                <Link href={checkinLink}>Open Web Check-In</Link>
              </Button>

              <Button asChild className="rounded-full border border-white/15 bg-transparent px-5 text-white hover:bg-white/10" variant="outline">
                <Link href="/bookings">My Bookings</Link>
              </Button>
            </div>

            {hasCompletedCheckin ? (
              <div className="flex items-center gap-3 p-4">
                <CheckCircle2 className="h-6 w-6 text-[#05DF72]" />
                <span className="font-body text-white">Your web check-in is complete!</span>
              </div>
            ) : null}

            <div className="flex flex-col w-full gap-2">
              <h2 className="font-sectiontitle text-lg font-bold text-white">Guests</h2>
              <p className="font-body text-white/82">{guestsDisplayLabel}</p>
            </div>
          </section>

          <section className="space-y-4 rounded-[16px] border border-white/12 bg-[#0d0d11] p-5 md:p-6">
            <h2 className="text-[22px] font-bold text-white">Stay Snapshot</h2>

            <div className="grid gap-x-6 gap-y-4 text-sm text-white/78 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/60">Check-in</p>
                <p className="mt-1 text-white">{formatDateLabel(checkinDate)} ({propertyGuidelines.checkIn})</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/60">Check-out</p>
                <p className="mt-1 text-white">{formatDateLabel(checkoutDate)} ({propertyGuidelines.checkOut})</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/60">Nights</p>
                <p className="mt-1 text-white">{getNightCount(checkinDate, checkoutDate)}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/60">Room</p>
                <p className="mt-1 text-white">{roomSummary}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/60">Guests</p>
                <p className="mt-1 text-white">{totalGuests}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/60">Status</p>
                <p className="mt-1 text-white">{toStatusLabel(booking?.status ?? snapshotFallback?.status)}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/60">Amount paid</p>
                <p className="mt-1 text-white">{formatCurrency(snapshotFallback?.amountPaid ?? 0)}</p>
              </div>
              {snapshotFallback?.paymentId ? (
                <div className="sm:col-span-2 lg:col-span-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/60">Payment reference</p>
                  <p className="mt-1 break-all text-white">{snapshotFallback.paymentId}</p>
                </div>
              ) : null}
            </div>

            <div className="flex items-start gap-2 text-sm text-white/75">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--vh-cyan)]" />
              <a className="underline decoration-white/30 underline-offset-4 hover:text-white" href={locationMap.embedUrl} rel="noreferrer" target="_blank">
                {locationMap.address}
              </a>
            </div>
          </section>

          <section className="rounded-[16px] border border-white/12 bg-[#0d0d11] p-5 md:p-6">
            <h2 className="text-[22px] font-bold text-white">Need-to-know</h2>

            <Accordion className="mt-2" collapsible type="single">
              <AccordionItem className="border-b border-white/10" value="room-info">
                <AccordionTrigger className="py-4 text-left text-white hover:text-[var(--vh-pink)]">Room Info</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pb-2 text-sm text-white/78">
                    <p className="font-semibold text-white">{roomSummary}</p>
                    <p>Check-in: {formatDateLabel(checkinDate)} ({propertyGuidelines.checkIn})</p>
                    <p>Check-out: {formatDateLabel(checkoutDate)} ({propertyGuidelines.checkOut})</p>
                    <p>Guests: {totalGuests}</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem className="border-b border-white/10" value="how-to-reach">
                <AccordionTrigger className="py-4 text-left text-white hover:text-[var(--vh-pink)]">How to Reach</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pb-2 text-sm text-white/78">
                    <p>{locationMap.address}</p>
                    <a className="inline-flex items-center gap-2 text-[var(--vh-cyan)] hover:text-white" href={locationMap.embedUrl} rel="noreferrer" target="_blank">
                      Open on maps
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem className="border-b border-white/10" value="cancellation-policy">
                <AccordionTrigger className="py-4 text-left text-white hover:text-[var(--vh-pink)]">Cancellation Policy</AccordionTrigger>
                <AccordionContent>
                  <p className="pb-2 text-sm text-white/78">Free cancellation windows depend on your booking type. Refer to your booking details for exact policy terms.</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem className="border-b border-white/10" value="property-policy">
                <AccordionTrigger className="py-4 text-left text-white hover:text-[var(--vh-pink)]">Property Policy</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 pb-2 text-sm text-white/78">
                    {propertyGuidelines.summary.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          {errorMessage ? (
            <div className="rounded-[12px] border border-[rgba(255,106,95,0.35)] bg-[rgba(255,106,95,0.1)] px-4 py-3 text-sm text-[#ffd9d4]">
              {errorMessage}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
