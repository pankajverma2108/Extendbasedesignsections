"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronRight, KeyRound, LoaderCircle, MapPin, Search, ShieldCheck } from "lucide-react";

import { useGuestAuth } from "@/components/auth/guest-auth-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StickerTag } from "@/components/shared/sticker-tag";
import { getGuestBookings, linkGuestBooking, type GuestBookingMineItem } from "@/lib/booking-api";
import { getStoredGuestToken } from "@/lib/guest-auth-api";

import { BookingEmptyState, BookingPageShell, formatDateLabel } from "@/components/booking/booking-shell";

function isActiveBooking(booking: GuestBookingMineItem): boolean {
  const checkoutDate = new Date(`${booking.checkout_date.slice(0, 10)}T12:00:00`).getTime();
  const now = new Date();
  now.setHours(12, 0, 0, 0);

  return checkoutDate >= now.getTime() && booking.status !== "CANCELLED" && booking.status !== "COMPLETED";
}

function bookingTone(booking: GuestBookingMineItem): string {
  if (booking.status === "CONFIRMED" || booking.status === "APPROVED") {
    return "border-[rgba(57,247,44,0.18)] bg-[rgba(57,247,44,0.06)] text-[var(--vh-lime)]";
  }

  if (booking.status === "PENDING_APPROVAL" || booking.status === "PENDING_PAYMENT") {
    return "border-[rgba(255,204,102,0.18)] bg-[rgba(255,204,102,0.06)] text-[var(--vh-amber)]";
  }

  return "border-white/10 bg-white/5 text-white/72";
}

function BookingListSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="rounded-[28px] border border-white/12 bg-[var(--vh-panel-strong)] p-6 shadow-[var(--vh-shadow-lg)]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <Skeleton className="h-4 w-24 rounded-full bg-white/10" />
              <Skeleton className="h-8 w-3/4 rounded-[10px] bg-white/10" />
              <Skeleton className="h-4 w-40 rounded-full bg-white/10" />
            </div>
            <Skeleton className="h-8 w-24 rounded-full bg-white/10" />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-24 rounded-[18px] bg-white/8" />
            <Skeleton className="h-24 rounded-[18px] bg-white/8" />
          </div>

          <div className="mt-6 flex gap-3">
            <Skeleton className="h-11 flex-1 rounded-full bg-white/10" />
            <Skeleton className="h-11 w-36 rounded-full bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

function BookingCard({ booking }: { booking: GuestBookingMineItem }) {
  const active = isActiveBooking(booking);

  return (
    <article className="rounded-[28px] border border-white/12 bg-[var(--vh-panel-strong)] p-6 shadow-[var(--vh-shadow-lg)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <StickerTag
            bg={active ? "#39ff14" : "#facc15"}
            className="px-3 py-1 text-[10px] font-bold not-italic uppercase tracking-[0.12em]"
            label={active ? "Active" : "Previous"}
            rotate={active ? "rotate-[-2deg]" : "rotate-[2deg]"}
            text="#0f172a"
          />
          <h2 className="mt-4 font-suez text-3xl uppercase tracking-[-0.04em] text-white">{booking.room_type_name}</h2>
          <p className="mt-2 text-sm text-white/60">{booking.ezee_reservation_id}</p>
        </div>
        <div className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${bookingTone(booking)}`}>
          {booking.status.replaceAll("_", " ")}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-[18px] border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-4 w-4 text-[var(--vh-cyan)]" />
            <p className="text-sm font-semibold text-white">Stay window</p>
          </div>
          <p className="mt-3 text-sm text-white/70">
            {formatDateLabel(booking.checkin_date)} to {formatDateLabel(booking.checkout_date)}
          </p>
        </div>
        <div className="rounded-[18px] border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-[var(--vh-amber)]" />
            <p className="text-sm font-semibold text-white">Property</p>
          </div>
          <p className="mt-3 text-sm text-white/70">{booking.property_id}</p>
          <p className="mt-1 text-xs text-white/45">{booking.room_number || "Room assigned after sync"}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-[18px] border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <KeyRound className="h-4 w-4 text-[var(--vh-pink)]" />
            <p className="text-sm font-semibold text-white">KYC slots</p>
          </div>
          <p className="mt-3 text-sm text-white/70">
            {(booking.kyc_completed_slots ?? 0)} of {booking.total_slots ?? 0} complete
          </p>
        </div>
        <div className="rounded-[18px] border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-4 w-4 text-[var(--vh-lime)]" />
            <p className="text-sm font-semibold text-white">Next action</p>
          </div>
          <p className="mt-3 text-sm text-white/70">
            {(booking.kyc_completed_slots ?? 0) >= (booking.total_slots ?? 1) ? "Booking ready for arrival" : "Finish pre-arrival setup"}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild className="rounded-full">
          <Link href={`/bookings/${encodeURIComponent(booking.ezee_reservation_id)}`}>
            Open booking
            <ChevronRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild className="rounded-full border border-white/15 bg-transparent text-white hover:bg-white/8">
          <Link href={`/bookings/${encodeURIComponent(booking.ezee_reservation_id)}/pre-arrival`}>
            Pre-arrival setup
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

    let cancelled = false;

    async function loadBookings() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await getGuestBookings(token);
        if (!cancelled) {
          setBookings(response);
        }
      } catch (error) {
        if (!cancelled) {
          setBookings([]);
          setErrorMessage(error instanceof Error ? error.message : "Unable to load your bookings.");
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
  }, [isAuthenticated, isRestoringSession]);

  const refreshBookings = async (token: string) => {
    const response = await getGuestBookings(token);
    setBookings(response);
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
      setLinkSuccess(`${response.booking.ezee_reservation_id} linked and synced successfully.`);
      setBookingIdInput("");
      setBookingFilter("active");
      await refreshBookings(token);
    } catch (error) {
      setLinkError(error instanceof Error ? error.message : "Unable to link this booking right now.");
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
      title="Track your stays and link a booking"
      description="Use the booking ID from your OTA, host, or travel partner to pull your stay into the guest dashboard."
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="rounded-[28px] border border-white/12 bg-[var(--vh-panel-strong)] p-6 shadow-[var(--vh-shadow-lg)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--vh-pink)]">Booking linking</p>
                <h2 className="mt-3 font-suez text-3xl uppercase tracking-[-0.04em] text-white">Add a booking from OTA or another guest</h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-white/68">
                  Paste the reservation ID you got from eZee, an OTA, or the person who booked it. We will fetch the stay, personal data, and guest slots into your account.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.14em] text-white/68">
                <Search className="h-4 w-4 text-[var(--vh-cyan)]" />
                Sync from backend
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
            <div className="grid gap-6 lg:grid-cols-2">
              {filteredBookings.map((booking) => (
                <BookingCard key={booking.ezee_reservation_id} booking={booking} />
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-[28px] border border-white/12 bg-[var(--vh-panel-strong)] p-6 shadow-[var(--vh-shadow-lg)]">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--vh-pink)]">How it works</p>
            <div className="mt-4 space-y-4 text-sm leading-7 text-white/72">
              <p>1. Paste the booking ID from the OTA, direct host, or person who booked it.</p>
              <p>2. We pull the reservation, guest slots, and KYC progress from the backend.</p>
              <p>3. Open the booking to finish KYC or review the stay before check-in.</p>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/12 bg-[var(--vh-panel-strong)] p-6 shadow-[var(--vh-shadow-lg)]">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--vh-pink)]">At a glance</p>
            <div className="mt-4 space-y-3 text-sm text-white/72">
              <p>Active bookings are shown first so current stays stay visible.</p>
              <p>Previous bookings are tucked behind the sticker tab when you need them.</p>
              <p>Linking a new reservation does not require an active stay already in progress.</p>
            </div>
          </div>
        </aside>
      </div>
    </BookingPageShell>
  );
}
