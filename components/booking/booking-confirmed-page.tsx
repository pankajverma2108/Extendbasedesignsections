"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  MapPin,
  MessageCircle,
  Phone,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { useGuestAuth } from "@/components/auth/guest-auth-provider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { locationMap, propertyGallery, propertyGuidelines } from "@/content/rooms";
import { linkGuestBooking, type BookingSlotSummary, type LinkGuestBookingResponse } from "@/lib/booking-api";
import { withBrandName, toBrandCheckinLink } from "@/lib/branding";
import { getConfirmedBookingSnapshot } from "@/lib/booking-session";
import { getStoredGuestToken } from "@/lib/guest-auth-api";
import { toSafeErrorMessage } from "@/lib/ui-error";

import { BookingEmptyState, BookingPageShell, formatCurrency, formatDateLabel, getNightCount } from "./booking-shell";

const EMPTY_SLOTS: BookingSlotSummary[] = [];

function slotStatusTone(status: string): string {
  if (status === "PRE_VERIFIED" || status === "VERIFIED") {
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
  const absoluteCheckinLink = typeof window !== "undefined" ? `${window.location.origin}${checkinLink}` : checkinLink;

  const whatsappMessage = useMemo(
    () =>
      `Our ${propertyName} stay is confirmed. Please finish your web check-in before arrival so we can skip the front-desk delay.\n\n${absoluteCheckinLink}`,
    [absoluteCheckinLink, propertyName],
  );

  const whatsappHref = useMemo(
    () => `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`,
    [whatsappMessage],
  );

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

  if (isRestoringSession || isLoading) {
    return (
      <BookingPageShell
        badge="Stay Confirmed"
        title="Loading confirmation"
        description="Fetching your latest booking confirmation and check-in status."
      >
        <div className="rounded-[28px] border border-white/12 bg-[var(--vh-panel-strong)] p-8 text-center text-white/72">
          Loading confirmation...
        </div>
      </BookingPageShell>
    );
  }

  if (!isAuthenticated) {
    return (
      <BookingPageShell
        badge="Stay Confirmed"
        title="Sign in to view confirmation"
        description="This screen is available for the guest account linked to this booking."
      >
        <div className="rounded-[28px] border border-white/12 bg-[var(--vh-panel-strong)] p-8 text-center shadow-[var(--vh-shadow-lg)]">
          <p className="text-lg font-semibold text-white">Guest sign-in required</p>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/70">
            Sign in with your booking account to open your confirmation and co-guest sharing tools.
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
        badge="Stay Confirmed"
        title="Confirmation unavailable"
        description="We could not open a recent confirmation snapshot for this booking."
      >
        <BookingEmptyState
          title="No confirmation found"
          description={errorMessage || "Please reopen your booking details and try again."}
          ctaHref={`/bookings/${encodeURIComponent(ezeeReservationId)}`}
          ctaLabel="Open booking details"
        />
      </BookingPageShell>
    );
  }

  return (
    <section className="vh-section min-h-screen bg-[var(--vh-section-b)] pt-24 md:pt-28 animate-vh-fade-in">
      <div className="vh-container">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="rounded-[28px] border border-white/12 bg-[var(--vh-panel-strong)] p-6 shadow-[var(--vh-shadow-lg)]">
            <div className="flex items-center justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(57,247,44,0.28)] bg-[rgba(57,247,44,0.08)] px-4 py-2 text-[var(--vh-lime)]">
                <CheckCircle2 className="h-4 w-4" />
                <p className="text-xs font-bold uppercase tracking-[0.14em]">Stay Confirmed</p>
              </div>
            </div>

            <h1 className="mt-4 text-center font-suez text-4xl uppercase tracking-[-0.04em] text-white md:text-5xl">
              Zo Zo Zo! Your stay at {propertyName} is confirmed
            </h1>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-6">
              <section className="rounded-[28px] border border-[rgba(57,247,44,0.22)] bg-[rgba(57,247,44,0.08)] p-6 shadow-[var(--vh-shadow-lg)]">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[rgba(57,247,44,0.35)] bg-[rgba(57,247,44,0.14)]">
                    <CheckCircle2 className="h-7 w-7 text-[var(--vh-lime)]" />
                  </div>
                  <div>
                    <h2 className="font-['Space_Grotesk'] text-2xl font-bold uppercase tracking-[-0.03em] text-white">
                      Your web check-in is complete
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-white/82">
                      You are all set to skip the queue. Carry your ID and walk into reception.
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-white/12 bg-[var(--vh-panel-strong)] p-6 shadow-[var(--vh-shadow-lg)]">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[var(--vh-pink)]" />
                  <h2 className="font-['Space_Grotesk'] text-xl font-bold uppercase tracking-[0.04em] text-white">Add Co-Guests</h2>
                </div>

                <p className="mt-3 text-sm leading-7 text-white/72">
                  Share this check-in link so your co-guests can complete their details before arrival.
                </p>

                <div className="mt-4 rounded-[14px] border border-white/10 bg-white/5 p-3 text-xs text-white/65 break-all">
                  {absoluteCheckinLink}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Button
                    className="rounded-[10px] bg-[var(--vh-pink)] text-white"
                    onClick={() => {
                      void navigator.clipboard.writeText(absoluteCheckinLink);
                      toast.success("Link copied", {
                        description: "Share it with your co-guests.",
                      });
                    }}
                    type="button"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </Button>
                  <Button asChild className="rounded-[10px] border border-white/15 bg-transparent text-white hover:bg-white/10" variant="outline">
                    <a href={whatsappHref} rel="noreferrer" target="_blank">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Share on WhatsApp
                    </a>
                  </Button>
                </div>

                <div className="mt-5 space-y-3">
                  {guests.map((slot) => (
                    <div key={slot.slot_id} className="rounded-[16px] border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.14em] text-white/50">{slot.label}</p>
                          <p className="mt-1 text-sm font-semibold text-white">{slot.guest_name || "Guest details pending"}</p>
                        </div>
                        <div className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${slotStatusTone(slot.kyc_status)}`}>
                          {toStatusLabel(slot.kyc_status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[28px] border border-white/12 bg-[var(--vh-panel-strong)] p-6 shadow-[var(--vh-shadow-lg)]">
                <h2 className="font-['Space_Grotesk'] text-xl font-bold uppercase tracking-[0.04em] text-white">Booking Info</h2>
                <Accordion className="mt-4" collapsible type="single">
                  <AccordionItem value="room-info">
                    <AccordionTrigger>Room Info</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 text-sm text-white/80">
                        <p className="font-semibold text-white">{roomSummary}</p>
                        <p>Check-in: {formatDateLabel(checkinDate)} ({propertyGuidelines.checkIn})</p>
                        <p>Check-out: {formatDateLabel(checkoutDate)} ({propertyGuidelines.checkOut})</p>
                        <p>Guests: {totalGuests}</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="payment-info">
                    <AccordionTrigger>Payment Info</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 text-sm text-white/80">
                        <p>Amount paid: <span className="font-semibold text-white">{formatCurrency(snapshotFallback?.amountPaid ?? 0)}</span></p>
                        <p>Status: <span className="font-semibold text-white">{toStatusLabel(booking?.status ?? snapshotFallback?.status)}</span></p>
                        {snapshotFallback?.paymentId ? (
                          <p>Payment reference: <span className="font-semibold text-white break-all">{snapshotFallback.paymentId}</span></p>
                        ) : null}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="how-to-reach">
                    <AccordionTrigger>How to Reach</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 text-sm text-white/80">
                        <p>{locationMap.address}</p>
                        <a className="inline-flex items-center gap-2 text-[var(--vh-cyan)] hover:text-white" href={locationMap.embedUrl} rel="noreferrer" target="_blank">
                          Open on maps
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="cancellation-policy">
                    <AccordionTrigger>Cancellation Policy</AccordionTrigger>
                    <AccordionContent>
                      Free cancellation windows depend on your booking type. Refer to your booking details for exact policy terms.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="property-policy">
                    <AccordionTrigger>Property Policy</AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-2 text-sm text-white/80">
                        {propertyGuidelines.summary.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </section>
            </div>

            <aside className="space-y-6">
              <section className="overflow-hidden rounded-[24px] border border-white/12 bg-[var(--vh-panel-strong)] shadow-[var(--vh-shadow-lg)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={propertyName}
                  className="h-[180px] w-full object-cover"
                  src={propertyGallery[0]?.src || "/images/property/hero-1.jpg"}
                />
                <div className="p-5">
                  <h3 className="font-['Space_Grotesk'] text-lg font-bold uppercase text-white">{propertyName}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/70">{locationMap.address}</p>

                  <div className="mt-4 grid gap-3">
                    <Button asChild className="rounded-[10px] border border-white/15 bg-transparent text-white hover:bg-white/10" variant="outline">
                      <a href={locationMap.embedUrl} rel="noreferrer" target="_blank">
                        <MapPin className="mr-2 h-4 w-4" />
                        Open Maps
                      </a>
                    </Button>
                    <Button className="rounded-[10px] border border-white/15 bg-transparent text-white hover:bg-white/10" type="button" variant="outline">
                      <Phone className="mr-2 h-4 w-4" />
                      Contact Front Desk
                    </Button>
                  </div>
                </div>
              </section>

              <section className="overflow-hidden rounded-[24px] border border-white/12 bg-[var(--vh-panel-strong)] shadow-[var(--vh-shadow-lg)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="Experience Bangalore"
                  className="h-[150px] w-full object-cover"
                  src={propertyGallery[1]?.src || "/images/property/hero-2.jpg"}
                />
                <div className="p-5">
                  <h3 className="font-['Space_Grotesk'] text-lg font-bold uppercase text-white">Experience Bangalore</h3>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    Discover nearby cafes, nightlife, and local spots during your stay.
                  </p>
                  <Button asChild className="mt-4 w-full rounded-[10px] border border-white/15 bg-transparent text-white hover:bg-white/10" variant="outline">
                    <Link href="/events">Explore experiences</Link>
                  </Button>
                </div>
              </section>

              <section className="rounded-[24px] border border-white/12 bg-[var(--vh-panel-strong)] p-5 shadow-[var(--vh-shadow-lg)]">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/50">Stay Summary</p>
                <div className="mt-4 space-y-3 text-sm text-white/80">
                  <div className="flex items-center justify-between">
                    <span>Nights</span>
                    <span className="font-semibold text-white">{getNightCount(checkinDate, checkoutDate)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    <span className="font-semibold text-white">{toStatusLabel(booking?.status ?? snapshotFallback?.status)}</span>
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  <Button asChild className="rounded-[10px] bg-[var(--vh-pink)] text-white">
                    <Link href="/bookings">My Bookings</Link>
                  </Button>
                  <Button asChild className="rounded-[10px] border border-white/15 bg-transparent text-white hover:bg-white/10" variant="outline">
                    <Link href={checkinLink}>Open Web Check-In</Link>
                  </Button>
                </div>
              </section>
            </aside>
          </div>

          {errorMessage ? (
            <div className="rounded-[20px] border border-[rgba(255,204,102,0.24)] bg-[rgba(255,204,102,0.1)] px-4 py-3 text-sm text-white/82">
              {errorMessage}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
