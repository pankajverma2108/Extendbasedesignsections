"use client";

import { useMemo } from "react";

import { useGuestAuth } from "@/components/auth/guest-auth-provider";

export default function BookingsPage() {
  const { guest, isAuthenticated, isRestoringSession, openAuthModal } = useGuestAuth();

  const bookings = useMemo(() => guest?.bookings ?? [], [guest?.bookings]);

  if (isRestoringSession) {
    return (
      <section className="vh-section">
        <div className="vh-container py-16 text-center text-white/75">Loading your bookings...</div>
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <section className="vh-section">
        <div className="vh-container py-16">
          <div className="mx-auto max-w-[560px] rounded-[12px] border border-white/20 bg-white/[0.04] p-8 text-center">
            <h1 className="text-3xl font-bold uppercase text-white">My Bookings</h1>
            <p className="mt-2 text-white/75">Sign in to see your linked stays.</p>
            <button
              className="mt-5 rounded-[10px] border-2 border-[#0F172A] bg-[var(--vh-pink)] px-5 py-3 text-sm font-extrabold uppercase text-white"
              onClick={() => openAuthModal("signin")}
              type="button"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="vh-section">
      <div className="vh-container py-8">
        <h1 className="text-3xl font-bold uppercase text-white">My Bookings</h1>
        <p className="mt-2 text-white/75">Track upcoming and past adventures.</p>

        {bookings.length === 0 ? (
          <div className="mt-6 rounded-[12px] border border-white/15 bg-white/[0.03] p-5 text-white/70">
            No bookings linked yet.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {bookings.map((booking) => (
              <article key={booking.ezee_reservation_id} className="rounded-[12px] border border-white/15 bg-white/[0.03] p-5">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--vh-cyan)]">{booking.status}</p>
                <p className="mt-1 text-lg font-bold text-white">{booking.room_type_name}</p>
                <p className="text-sm text-white/70">Reservation: {booking.ezee_reservation_id}</p>
                <p className="mt-3 text-sm text-white/80">Check-in: {new Date(booking.checkin_date).toLocaleDateString()}</p>
                <p className="text-sm text-white/80">Check-out: {new Date(booking.checkout_date).toLocaleDateString()}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
