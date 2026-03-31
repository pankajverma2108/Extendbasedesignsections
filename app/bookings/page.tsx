"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronRight, KeyRound, LoaderCircle, MapPin, ShieldCheck } from "lucide-react";

import { useGuestAuth } from "@/components/auth/guest-auth-provider";
import { Button } from "@/components/ui/button";
import { getGuestBookings, type GuestBookingMineItem } from "@/lib/booking-api";
import { getStoredGuestToken } from "@/lib/guest-auth-api";

import { BookingEmptyState, BookingPageShell, formatDateLabel } from "@/components/booking/booking-shell";

function statusTone(status: string): string {
  if (status === "CONFIRMED" || status === "APPROVED") {
    return "border-[rgba(57,247,44,0.2)] bg-[rgba(57,247,44,0.08)] text-[var(--vh-lime)]";
  }

  if (status === "PENDING_APPROVAL" || status === "PENDING_PAYMENT") {
    return "border-[rgba(255,204,102,0.2)] bg-[rgba(255,204,102,0.08)] text-[var(--vh-amber)]";
  }

  return "border-white/10 bg-white/5 text-white/70";
}

export default function BookingsPage() {
  const { guest, isAuthenticated, isRestoringSession, openAuthModal } = useGuestAuth();
  const [bookings, setBookings] = useState<GuestBookingMineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  if (isRestoringSession || isLoading) {
    return (
      <BookingPageShell
        badge="My Bookings"
        title="Loading your stays"
        description="Fetching the guest-linked booking list and the latest KYC progress."
      >
        <div className="rounded-[28px] border border-white/12 bg-[var(--vh-panel-strong)] p-8 text-center text-white/72">
          <LoaderCircle className="mx-auto mb-3 h-5 w-5 animate-spin" />
          Loading bookings...
        </div>
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
      title="Track your stays and pre-arrival tasks"
      description="This list comes from the guest booking APIs and is the entry point into the new booking detail and KYC flow."
    >
      {errorMessage ? (
        <div className="rounded-[22px] border border-[rgba(255,204,102,0.22)] bg-[rgba(255,204,102,0.08)] px-5 py-4 text-sm text-white/82">
          {errorMessage}
        </div>
      ) : null}

      {visibleBookings.length === 0 ? (
        <BookingEmptyState
          title="No linked bookings yet"
          description="Once you complete a direct booking or link an existing reservation, it will show up here with booking detail and pre-arrival actions."
          ctaHref="/property"
          ctaLabel="Find a room"
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {visibleBookings.map((booking) => (
            <article key={booking.ezee_reservation_id} className="rounded-[28px] border border-white/12 bg-[var(--vh-panel-strong)] p-6 shadow-[var(--vh-shadow-lg)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--vh-pink)]">{booking.role}</p>
                  <h2 className="mt-2 font-suez text-3xl uppercase tracking-[-0.04em] text-white">{booking.room_type_name}</h2>
                  <p className="mt-1 text-sm text-white/60">{booking.ezee_reservation_id}</p>
                </div>
                <div className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${statusTone(booking.status)}`}>
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
          ))}
        </div>
      )}
    </BookingPageShell>
  );
}
