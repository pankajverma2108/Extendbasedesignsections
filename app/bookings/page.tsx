"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ChevronRight, LoaderCircle, MapPin, Search } from "lucide-react";

import { useGuestAuth } from "@/components/auth/guest-auth-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StickerTag } from "@/components/shared/sticker-tag";
import { propertyHero } from "@/content/rooms";
import { getGuestBookings, linkGuestBooking, type GuestBookingMineItem } from "@/lib/booking-api";
import { withBrandName, toBrandCheckinLink } from "@/lib/branding";
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

function BookingListSkeleton() {
  return (
    <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="relative mx-auto w-full max-w-[340px] pt-6">
          <Skeleton className="absolute -top-0 right-2 h-10 w-32 rounded-[10px] bg-white/10" />
          <div className="rounded-[16px] border border-white/15 bg-[rgba(246,241,234,0.9)] p-6 shadow-[8px_8px_0_0_var(--vh-pink)]">
            <div className="space-y-2">
              <Skeleton className="h-3 w-28 rounded-full bg-black/10" />
              <Skeleton className="h-11 w-36 rounded-[8px] bg-black/10" />
            </div>

            <Skeleton className="mt-5 h-24 w-full rounded-[12px] bg-black/10" />
            <Skeleton className="mt-4 h-16 w-full rounded-[12px] bg-black/10" />
            <Skeleton className="mt-5 h-36 w-full rounded-[12px] bg-black/10" />
            <Skeleton className="mt-4 h-9 w-full rounded-full bg-black/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

function BookingSummaryTicket({ booking }: { booking: GuestBookingMineItem }) {
  const active = isActiveBooking(booking);
  const propertyLabel = withBrandName(booking.property_id);
  const qrPattern = useMemo(() => buildQrPattern(booking.ezee_reservation_id), [booking.ezee_reservation_id]);
  const accessPasscode = useMemo(() => getArrivalCredential(booking.ezee_reservation_id, "#", 6), [booking.ezee_reservation_id]);
  const roomNumber = booking.room_number || "Assigned at check-in";
  const normalizedStatus = booking.status.replaceAll("_", " ");
  const totalSlots = Math.max(booking.total_slots ?? 0, 1);
  const completedSlots = booking.kyc_completed_slots ?? 0;

  return (
    <article className="relative mx-auto w-full max-w-[340px] pt-6">
      <div className="absolute -right-1 -top-1 z-10 rotate-[10deg] rounded-[11px] border-2 border-[var(--vh-surface-2)] bg-[var(--vh-pink)] px-5 py-2 shadow-[0_8px_16px_rgba(0,0,0,0.25)]">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-white">
          {active ? "You are in" : "Archived"}
        </p>
      </div>

      <div className="-rotate-1 rounded-[16px] border-2 border-[var(--vh-border)] bg-[#f6f1ea] p-6 text-[var(--vh-surface-2)] shadow-[8px_8px_0_0_var(--vh-pink)] transition-transform duration-300 hover:-translate-y-1 hover:-rotate-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--vh-surface)]/70">Confirmation Receipt</p>
          <p className="mt-2 break-all text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--vh-surface)]/55">Reservation {booking.ezee_reservation_id}</p>
          <div className="mt-2 font-['Space_Grotesk'] text-[44px] font-black leading-[0.92] text-[var(--vh-surface)]">
            <p>{formatPosterDate(booking.checkin_date)}</p>
            <p>{formatPosterDate(booking.checkout_date)}</p>
          </div>
        </div>

        <div className="mt-6 rounded-[12px] bg-[var(--vh-surface)] px-5 py-4 text-white">
          <p className="text-[11px] uppercase tracking-[0.12em] text-white/60">Room Details</p>
          <p className="mt-1 text-xl font-bold tracking-tight">{booking.room_type_name || "Room details pending"}</p>
          <p className="text-base font-semibold text-white/80">{roomNumber}</p>
        </div>

        <div className="mt-5 rounded-[12px] border border-dashed border-[rgba(45,39,75,0.16)] bg-white/55 px-4 py-3 text-sm text-[var(--vh-surface-2)]/78">
          Keep this receipt handy. Status is {normalizedStatus.toLowerCase()} and KYC is {completedSlots}/{totalSlots} complete.
        </div>

        <div className="mt-5 flex justify-center">
          <div className="rounded-[12px] border-4 border-[var(--vh-surface-2)] bg-white p-3">
            <div className="grid grid-cols-9 gap-1 rounded-[8px] bg-[var(--vh-surface-2)] p-3">
              {qrPattern.map((filled, index) => (
                <div
                  key={`${booking.ezee_reservation_id}-${index}`}
                  className={filled ? "h-3 w-3 rounded-sm bg-white" : "h-3 w-3 bg-[var(--vh-surface-2)]"}
                />
              ))}
            </div>
            <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--vh-surface-2)]">
              Scan for room access
            </p>
            <p className="text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--vh-surface-2)]/70">
              Access code {accessPasscode}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-start gap-2 text-sm text-[var(--vh-surface)]/80">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p>{propertyLabel}</p>
            <p>{propertyHero.address}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <StickerTag bg="#fef08a" className="px-3 py-1.5 text-[10px] font-bold not-italic uppercase tracking-[0.12em]" label="Bring the whole gang" rotate="rotate-[-2deg]" text="#0f172a" />
          <StickerTag bg="#39ff14" className="px-3 py-1.5 text-[10px] font-bold not-italic uppercase tracking-[0.12em]" label="KYC before chaos" rotate="rotate-[1deg]" text="#0f172a" />
          <StickerTag bg="#00d1ff" className="px-3 py-1.5 text-[10px] font-bold not-italic uppercase tracking-[0.12em]" label="Scan, stay, repeat" rotate="rotate-[-1deg]" text="#0f172a" />
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button asChild className="rounded-full bg-[var(--vh-pink)] text-white hover:bg-[var(--vh-pink)]/90">
          <Link href={toBrandCheckinLink(booking.ezee_reservation_id)}>
            Open booking
            <ChevronRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild className="rounded-full border border-white/15 bg-transparent text-white hover:bg-white/8">
          <Link href={`/bookings/${encodeURIComponent(booking.ezee_reservation_id)}/confirmed`}>
            Stay confirmed
          </Link>
        </Button>
      </div>
    </article>
  );
}

export default function BookingsPage() {
  const { guest, isAuthenticated, isRestoringSession, openAuthModal } = useGuestAuth();
  const [bookings, setBookings] = useState<GuestBookingMineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bookingFilter, setBookingFilter] = useState<"active" | "previous">("active");
  const [bookingIdInput, setBookingIdInput] = useState("");
  const [isLinkingBooking, setIsLinkingBooking] = useState(false);
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);

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
        description="Fetching the guest-linked booking list and the latest KYC progress."
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
        description="Bookings are tied to the guest account that completed or linked the reservation."
      >
        <div className="rounded-[28px] border border-white/12 bg-[var(--vh-panel-strong)] p-8 text-center shadow-[var(--vh-shadow-lg)]">
          <p className="text-lg font-semibold text-white">Guest sign-in required</p>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/70">
            Use the guest account associated with your reservation. Once you are signed in, your stays and pre-arrival progress will appear here.
          </p>
          <Button className="mt-6 rounded-full px-6" onClick={() => openAuthModal("signin")} type="button">
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
      description="Each stay is shown as a receipt-style summary card with instant access to booking details and web check-in."
    >
      <div className="space-y-6">
        <div className="rounded-[28px] border border-white/12 bg-[var(--vh-panel-strong)] p-6 shadow-[var(--vh-shadow-lg)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--vh-pink)]">Booking linking</p>
              <h2 className="mt-3 font-suez text-3xl uppercase tracking-[-0.04em] text-white">Add a booking from OTA or another guest</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-white/68">
                Paste the reservation ID you got from your OTA, host, or travel buddy. We will pull your stay and guest slots instantly.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.14em] text-white/68">
              <Search className="h-4 w-4 text-[var(--vh-cyan)]" />
              Live sync
            </div>
          </div>

          <form className="mt-6 space-y-3" onSubmit={handleLinkBooking}>
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
              <input
                className="h-12 rounded-full border border-white/12 bg-white/5 px-4 text-sm text-white placeholder:text-white/35 outline-none focus:border-[var(--vh-cyan)]"
                onChange={(event) => setBookingIdInput(event.target.value)}
                placeholder="Enter booking ID or reservation code"
                value={bookingIdInput}
              />
              <Button className="h-12 rounded-full px-6" disabled={isLinkingBooking} type="submit">
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
            {linkSuccess ? <p className="text-sm text-[var(--vh-lime)]">{linkSuccess}</p> : null}
          </form>
        </div>

        {errorMessage ? (
          <div className="rounded-[22px] border border-[rgba(255,204,102,0.22)] bg-[rgba(255,204,102,0.08)] px-5 py-4 text-sm text-white/82">
            {errorMessage}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => setBookingFilter("active")} type="button">
            <StickerTag
              bg={bookingFilter === "active" ? "#39ff14" : "#fef08a"}
              className="px-4 py-2 text-sm font-bold not-italic uppercase tracking-[0.08em]"
              label={`Active bookings (${activeBookings.length})`}
              rotate="rotate-[-2deg]"
              text="#0f172a"
            />
          </button>
          <button onClick={() => setBookingFilter("previous")} type="button">
            <StickerTag
              bg={bookingFilter === "previous" ? "#c62828" : "#fef08a"}
              className="px-4 py-2 text-sm font-bold not-italic uppercase tracking-[0.08em]"
              label={`Previous bookings (${previousBookings.length})`}
              rotate="rotate-[2deg]"
              text="#0f172a"
            />
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
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {filteredBookings.map((booking) => (
              <BookingSummaryTicket key={booking.ezee_reservation_id} booking={booking} />
            ))}
          </div>
        )}
      </div>
    </BookingPageShell>
  );
}
