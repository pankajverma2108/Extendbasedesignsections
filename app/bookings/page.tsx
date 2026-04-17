"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { LoaderCircle, MapPin, Search } from "lucide-react";
import { toast } from "sonner";

import { useGuestAuth } from "@/components/auth/guest-auth-provider";
import { StickerTag } from "@/components/shared/sticker-tag";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { propertyHero } from "@/content/rooms";
import { getGuestBookings, linkGuestBooking, type GuestBookingMineItem } from "@/lib/booking-api";
import { toBrandCheckinLink, withBrandName } from "@/lib/branding";
import { getClientCache, setClientCache } from "@/lib/client-cache";
import { getStoredGuestToken } from "@/lib/guest-auth-api";
import { toSafeErrorMessage } from "@/lib/ui-error";

import { BookingEmptyState, BookingPageShell } from "@/components/booking/booking-shell";

const BOOKINGS_CACHE_TTL_MS = 1000 * 60 * 3;

function bookingsCacheKey(guestId?: string): string | null {
  if (!guestId) {
    return null;
  }

  return `vh:guest-bookings:${guestId}`;
}

function isActiveBooking(booking: GuestBookingMineItem): boolean {
  const checkoutDate = new Date(`${booking.checkout_date.slice(0, 10)}T12:00:00`).getTime();
  const now = new Date();
  now.setHours(12, 0, 0, 0);

  return checkoutDate >= now.getTime() && booking.status !== "CANCELLED" && booking.status !== "COMPLETED";
}

function bookingCardHref(booking: GuestBookingMineItem): string {
  const totalSlots = Math.max(booking.total_slots ?? 1, 1);
  const completedSlots = booking.kyc_completed_slots ?? 0;

  if (completedSlots >= totalSlots) {
    return `/bookings/${encodeURIComponent(booking.ezee_reservation_id)}/confirmed`;
  }

  return toBrandCheckinLink(booking.ezee_reservation_id);
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

function BookingListSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="relative mx-auto w-full max-w-[340px] pt-5 sm:max-w-none sm:pt-6">
          <Skeleton className="absolute right-2 top-0 h-9 w-24 rounded-[10px] bg-white/10" />
          <div className="rounded-[16px] border border-white/10 bg-[rgba(245,240,233,0.88)] p-5">
            <Skeleton className="h-3 w-24 bg-black/10" />
            <Skeleton className="mt-3 h-10 w-32 bg-black/10" />
            <Skeleton className="mt-5 h-20 w-full rounded-[12px] bg-black/10" />
            <Skeleton className="mt-4 h-16 w-full rounded-[12px] bg-black/10" />
            <Skeleton className="mt-4 h-32 w-full rounded-[12px] bg-black/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

function BookingSummaryTicket({ booking }: { booking: GuestBookingMineItem }) {
  const active = isActiveBooking(booking);
  const propertyLabel = withBrandName(booking.property_id);
  const roomNumber = booking.room_number || "Assigned at check-in";
  const destinationHref = bookingCardHref(booking);

  return (
    <article className="relative mx-auto w-full max-w-[340px] pt-5 sm:max-w-none sm:pt-6">
      <Link
        aria-label={`Open booking ${booking.ezee_reservation_id}`}
        className="group block focus-visible:outline-none"
        href={destinationHref}
      >
        <div className="absolute right-2 top-0 z-10 rounded-[11px] border-2 border-[var(--vh-surface-2)] bg-[var(--vh-pink)] px-4 py-1.5 shadow-[0_8px_16px_rgba(0,0,0,0.25)] md:rotate-[10deg] md:px-5 md:py-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-white">{active ? "You're in" : "Past stay"}</p>
        </div>

        <div className="rounded-[16px] border-2 border-[var(--vh-border)] bg-[var(--vh-ice)] p-4 text-[var(--vh-surface-2)] shadow-[8px_8px_0_0_var(--vh-pink)] transition-transform duration-300 sm:p-6 md:-rotate-1 md:hover:-translate-y-1 md:hover:-rotate-2 md:group-hover:-translate-y-1 md:group-hover:-rotate-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--vh-surface)]/70">Confirmation Receipt</p>
            <p className="mt-2 break-all text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--vh-surface)]/55">
              Reservation {booking.ezee_reservation_id}
            </p>
            <div className="mt-2 font-['Space_Grotesk'] text-[36px] font-black leading-[0.92] text-[var(--vh-surface)] sm:text-[44px]">
              <p>{formatPosterDate(booking.checkin_date)}</p>
              <p>{formatPosterDate(booking.checkout_date)}</p>
            </div>
          </div>

          <div className="mt-5 rounded-[12px] bg-[var(--vh-surface)] px-4 py-4 text-white sm:mt-6 sm:px-5">
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/60">Room Details</p>
            <p className="mt-1 text-lg font-bold tracking-tight sm:text-xl">{booking.room_type_name || "Room details pending"}</p>
            <p className="text-sm font-semibold text-white/80 sm:text-base">{roomNumber}</p>
          </div>

          <div className="mt-4 flex items-start gap-2 text-sm text-[var(--vh-surface)]/80 sm:mt-5">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p>{propertyLabel}</p>
              <p>{propertyHero.address}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 justify-items-center gap-2 sm:mt-5">
            <StickerTag bg="#39ff14" className="px-3 py-1.5 text-[10px] font-bold not-italic uppercase tracking-[0.12em]" label="KYC before chaos" rotate="rotate-[1deg]" text="#0f172a" />
            <StickerTag bg="#00d1ff" className="px-3 py-1.5 text-[10px] font-bold not-italic uppercase tracking-[0.12em]" label="Scan, stay, repeat" rotate="rotate-[-1deg]" text="#0f172a" />
            <div className="col-span-2">
              <StickerTag bg="#fef08a" className="px-3 py-1.5 text-[10px] font-bold not-italic uppercase tracking-[0.12em]" label="Bring the whole gang" rotate="rotate-[-2deg]" text="#0f172a" />
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default function BookingsPage() {
  const { guest, isAuthenticated, isRestoringSession, openAuthModal } = useGuestAuth();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<GuestBookingMineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bookingFilter, setBookingFilter] = useState<"active" | "previous">("active");
  const [bookingIdInput, setBookingIdInput] = useState("");
  const [isLinkingBooking, setIsLinkingBooking] = useState(false);
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [freshToastShown, setFreshToastShown] = useState(false);

  useEffect(() => {
    const freshReservation = searchParams.get("fresh");
    if (!freshReservation || freshToastShown) {
      return;
    }

    toast.success("Booking confirmed", {
      description: `${freshReservation} is now available in My Bookings.`,
    });
    setBookingFilter("active");
    setFreshToastShown(true);
  }, [freshToastShown, searchParams]);

  useEffect(() => {
    if (isRestoringSession) {
      return;
    }

    if (!isAuthenticated) {
      setBookings([]);
      setIsLoading(false);
      return;
    }

    const storedToken = getStoredGuestToken();
    if (typeof storedToken !== "string" || storedToken.length === 0) {
      setBookings([]);
      setIsLoading(false);
      return;
    }
    const token = storedToken;
    const cacheKey = bookingsCacheKey(guest?.id);

    let cancelled = false;

    async function loadBookings() {
      setIsLoading(true);
      setErrorMessage(null);

      const cachedBookings = cacheKey ? getClientCache<GuestBookingMineItem[]>(cacheKey, BOOKINGS_CACHE_TTL_MS) : null;
      if (cachedBookings && !cancelled) {
        setBookings(cachedBookings);
        setIsLoading(false);
      }

      try {
        const response = await getGuestBookings(token);
        if (!cancelled) {
          setBookings(response);
          if (cacheKey) {
            setClientCache(cacheKey, response);
          }
        }
      } catch (error) {
        if (!cancelled) {
          if (!cachedBookings) {
            setBookings([]);
          }
          setErrorMessage(toSafeErrorMessage(error, "Unable to load your bookings right now."));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadBookings();

    return () => {
      cancelled = true;
    };
  }, [guest?.id, isAuthenticated, isRestoringSession]);

  const refreshBookings = async (token: string) => {
    const response = await getGuestBookings(token);
    setBookings(response);
    const cacheKey = bookingsCacheKey(guest?.id);
    if (cacheKey) {
      setClientCache(cacheKey, response);
    }
  };

  const handleLinkBooking = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLinkError(null);
    setLinkSuccess(null);

    const ezeeReservationId = bookingIdInput.trim();
    if (!ezeeReservationId) {
      setLinkError("Enter the booking ID from your OTA or host.");
      return;
    }

    const token = getStoredGuestToken();
    if (typeof token !== "string" || token.length === 0) {
      setLinkError("Sign in first, then link the booking ID.");
      return;
    }

    setIsLinkingBooking(true);

    try {
      const response = await linkGuestBooking(token, ezeeReservationId);
      setLinkSuccess(`${response.booking.ezee_reservation_id} linked and ready.`);
      setBookingIdInput("");
      setBookingFilter("active");
      await refreshBookings(token);
    } catch (error) {
      setLinkError(toSafeErrorMessage(error, "Unable to link this booking right now."));
    } finally {
      setIsLinkingBooking(false);
    }
  };

  const fallbackBookings = useMemo(
    () =>
      (guest?.bookings ?? []).map<GuestBookingMineItem>((booking) => ({
        ezee_reservation_id: booking.ezee_reservation_id,
        role: booking.role,
        status: booking.status,
        room_type_name: booking.room_type_name,
        checkin_date: booking.checkin_date,
        checkout_date: booking.checkout_date,
        property_id: booking.property_id,
      })),
    [guest?.bookings],
  );

  const visibleBookings = bookings.length > 0 ? bookings : fallbackBookings;
  const activeBookings = visibleBookings.filter(isActiveBooking);
  const previousBookings = visibleBookings.filter((booking) => !isActiveBooking(booking));
  const filteredBookings = bookingFilter === "active" ? activeBookings : previousBookings;

  if (isRestoringSession || isLoading) {
    return (
      <BookingPageShell
        badge="My Bookings"
        title="Loading your stays"
        description="Fetching your reservations, room details, and check-in status."
      >
        <BookingListSkeleton />
      </BookingPageShell>
    );
  }

  if (!isAuthenticated) {
    return (
      <BookingPageShell
        badge="My Bookings"
        title="Sign in to view your bookings"
        description="Bookings are linked to the guest account that completed or linked the reservation."
      >
        <div className="rounded-[18px] border border-white/12 bg-[var(--vh-panel-strong)] p-6 text-center shadow-[0_20px_45px_rgba(0,0,0,0.35)] sm:p-8">
          <p className="text-lg font-semibold text-white">Guest sign-in required</p>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/72">
            Use the same guest account used in your booking. Your stays and web check-in progress will appear right away.
          </p>
          <Button className="mt-6 rounded-full bg-[var(--vh-pink)] px-6 text-white hover:bg-[var(--vh-pink-soft)]" onClick={() => openAuthModal("signin")} type="button">
            Sign in to continue
          </Button>
        </div>
      </BookingPageShell>
    );
  }

  return (
    <BookingPageShell
      badge="My Bookings"
      title="Your booking tickets"
      description=""
    >
      <div className="space-y-6">
        <div className="rounded-[20px] border border-white/12 bg-[var(--vh-panel-strong)] p-4 shadow-[0_20px_45px_rgba(0,0,0,0.35)] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--vh-pink)]">Booking Linking</p>
              <h2 className="mt-2 font-suez text-2xl uppercase tracking-[-0.02em] text-white sm:text-3xl">Add a booking from OTA or another guest</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-white/72">
                Paste the reservation ID from your OTA, host, or travel buddy and we will pull the stay instantly.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/70">
              <Search className="h-3.5 w-3.5 text-[var(--vh-cyan)]" />
              Live Sync
            </div>
          </div>

          <form className="mt-5 space-y-3" onSubmit={handleLinkBooking}>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <input
                className="h-12 rounded-full border border-white/12 bg-white/5 px-4 text-sm text-white placeholder:text-white/40 outline-none focus:border-[var(--vh-cyan)]"
                onChange={(event) => setBookingIdInput(event.target.value)}
                placeholder="Enter booking ID or reservation code"
                value={bookingIdInput}
              />
              <Button className="h-12 rounded-full bg-[var(--vh-pink)] px-6 text-white hover:bg-[var(--vh-pink-soft)]" disabled={isLinkingBooking} type="submit">
                {isLinkingBooking ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Linking
                  </>
                ) : (
                  "Link booking"
                )}
              </Button>
            </div>
            {linkError ? <p className="text-sm text-[var(--vh-hot)]">{linkError}</p> : null}
            {linkSuccess ? <p className="text-sm text-[#05DF72]">{linkSuccess}</p> : null}
            {errorMessage ? <p className="text-sm text-[#ffcc66]">{errorMessage}</p> : null}
          </form>
        </div>

        <div className="inline-flex rounded-[12px] bg-[var(--vh-panel-strong)] p-1">
          <button
            className={[
              "rounded-[10px] px-4 py-2 text-sm font-bold uppercase tracking-[0.08em] transition-colors",
              bookingFilter === "active" ? "bg-[var(--vh-pink)] text-white" : "text-white/70 hover:bg-white/5",
            ].join(" ")}
            onClick={() => setBookingFilter("active")}
            type="button"
          >
            Active ({activeBookings.length})
          </button>
          <button
            className={[
              "rounded-[10px] px-4 py-2 text-sm font-bold uppercase tracking-[0.08em] transition-colors",
              bookingFilter === "previous" ? "bg-[var(--vh-pink)] text-white" : "text-white/70 hover:bg-white/5",
            ].join(" ")}
            onClick={() => setBookingFilter("previous")}
            type="button"
          >
            Previous ({previousBookings.length})
          </button>
        </div>

        {filteredBookings.length === 0 ? (
          <BookingEmptyState
            ctaHref="/property"
            ctaLabel="Find a room"
            description={
              bookingFilter === "active"
                ? "No active bookings are running right now. Link an OTA reservation above to pull it into the dashboard."
                : "No previous bookings found for this guest account yet. Once a stay ends, it will move here automatically."
            }
            title={bookingFilter === "active" ? "Nothing active yet" : "No previous bookings yet"}
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filteredBookings.map((booking) => (
              <BookingSummaryTicket key={booking.ezee_reservation_id} booking={booking} />
            ))}
          </div>
        )}
      </div>
    </BookingPageShell>
  );
}
