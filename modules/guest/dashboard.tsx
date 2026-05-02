"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BedDouble, BookOpen, CalendarPlus, ConciergeBell, DoorOpen, KeyRound, LockKeyhole, PackagePlus, PartyPopper, ShieldCheck, ShoppingBag, UserPlus, Waypoints } from "lucide-react";
import { toast } from "sonner";

import { useGuestAuth } from "@/components/auth/guest-auth-provider";
import { BentoCard } from "@/components/guest/bento-card";
import { guestStickerTags } from "@/components/guest/guest-sticker-tags";
import { SectionBlock } from "@/components/guest/section-block";
import { Button } from "@/components/ui/button";
import { getGuestBookings, type GuestDashboardBooking } from "@/lib/guest-experience-api";
import { getStoredGuestToken } from "@/lib/guest-auth-api";
import { useGuestExperience } from "@/state/guest-experience-provider";

const dashboardCards = [
  {
    title: "Services",
    description: "Ask for housekeeping, maintenance, or front-desk help without leaving the guest hub.",
    href: "/guest/services",
    icon: ConciergeBell,
    sticker: guestStickerTags.services,
  },
  {
    title: "Add-ons",
    description: "Build a small cart for stay extras and review it before checkout.",
    href: "/guest/addons",
    icon: ShoppingBag,
    sticker: guestStickerTags.addons,
  },
  {
    title: "Borrow",
    description: "Request borrowable items and keep returns visible in the same place.",
    href: "/guest/borrow",
    icon: PackagePlus,
    sticker: guestStickerTags.borrow,
  },
  {
    title: "Extend",
    description: "Prepare stay extension, late checkout, or early check-in requests from one route.",
    href: "/guest/extend",
    icon: CalendarPlus,
    sticker: guestStickerTags.extend,
  },
  {
    title: "Guide",
    description: "Open the property guide for access, house rules, nearby notes, and useful details.",
    href: "/guest/guide",
    icon: BookOpen,
    sticker: guestStickerTags.guide,
  },
];

export function GuestDashboard() {
  const { guest } = useGuestAuth();
  const { selectedBookingId } = useGuestExperience();
  const [bookingFallback, setBookingFallback] = useState<GuestDashboardBooking | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const bookingFromAuth = useMemo(() => {
    const candidates = guest?.bookings ?? [];
    if (candidates.length === 0) {
      return null;
    }

    const selected = selectedBookingId
      ? candidates.find((item) => item.ezee_reservation_id === selectedBookingId)
      : candidates.find((item) => item.status === "APPROVED") ?? candidates[0];

    if (!selected) {
      return null;
    }

    return {
      ezee_reservation_id: selected.ezee_reservation_id,
      role: selected.role,
      status: selected.status,
      room_type_name: selected.room_type_name,
      room_number: selected.room_number ?? null,
      checkin_date: selected.checkin_date,
      checkout_date: selected.checkout_date,
      property_id: selected.property_id,
      property_name: selected.property_name ?? null,
      door_passcode: selected.door_passcode ?? null,
      lock_status: selected.lock_status ?? null,
    } satisfies GuestDashboardBooking;
  }, [guest?.bookings, selectedBookingId]);

  useEffect(() => {
    if (bookingFromAuth) {
      setBookingFallback(null);
      setBookingError(null);
      return;
    }

    const token = getStoredGuestToken();
    if (!token) {
      setBookingFallback(null);
      return;
    }

    let cancelled = false;
    setBookingLoading(true);
    setBookingError(null);

    void getGuestBookings(token)
      .then((bookings) => {
        if (cancelled) {
          return;
        }

        const selected = selectedBookingId
          ? bookings.find((item) => item.ezee_reservation_id === selectedBookingId)
          : bookings.find((item) => item.status === "APPROVED") ?? bookings[0] ?? null;

        setBookingFallback(selected ?? null);
      })
      .catch((error) => {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Unable to load booking details.";
          setBookingError(message);
          setBookingFallback(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setBookingLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [bookingFromAuth, selectedBookingId]);

  const activeBooking = bookingFromAuth ?? bookingFallback;
  const hasSmartLockData = Boolean(activeBooking?.door_passcode);

  const formatDate = (value?: string | null) => {
    if (!value) {
      return "TBA";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "TBA";
    }
    return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
  };

  const stayCards = [
    {
      label: "Room",
      value: activeBooking?.room_number || "Room TBA",
      detail: activeBooking?.room_type_name ? `${activeBooking.room_type_name}` : "Final room details appear after check-in.",
      icon: DoorOpen,
    },
    {
      label: "Stay",
      value: activeBooking?.status ?? "Pending",
      detail: `${formatDate(activeBooking?.checkin_date)} - ${formatDate(activeBooking?.checkout_date)}`,
      icon: BedDouble,
    },
    {
      label: "Passcode",
      value: hasSmartLockData ? activeBooking?.door_passcode ?? "" : "Hidden",
      detail: hasSmartLockData
        ? `Lock status: ${activeBooking?.lock_status ?? "ACTIVE"}`
        : "Access will be available at check-in.",
      icon: LockKeyhole,
    },
  ];

  return (
    <div className="space-y-9">
      <SectionBlock
        description="A calm control room for the stay: access details, requests, add-ons, borrowing, and guide links stay in one place."
        sticker={guestStickerTags.dashboard}
        title="Stay dashboard"
        action={
          <Button asChild className="h-10 rounded-[14px] bg-white px-4 text-[#07070a] hover:bg-white/90">
            <Link href="/guest/checkout">
              <KeyRound className="mr-2 h-4 w-4" />
              Checkout summary
            </Link>
          </Button>
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          {stayCards.map((item) => {
            const Icon = item.icon;

            return (
              <article key={item.label} className="rounded-[20px] border border-dashed border-white/22 bg-white/[0.035] p-5 shadow-[0_18px_38px_rgba(0,0,0,0.2)]">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/54">{item.label}</p>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white">
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <p className="mt-5 font-suez text-[28px] uppercase leading-none tracking-[-0.03em] text-white">{item.value}</p>
                <p className="mt-3 text-sm leading-6 text-white/60">{item.detail}</p>
              </article>
            );
          })}
        </div>
        {selectedBookingId ? (
          <p className="text-xs uppercase tracking-[0.11em] text-white/52">Booking: {selectedBookingId}</p>
        ) : (
          <p className="text-xs uppercase tracking-[0.11em] text-white/52">No active booking selected yet.</p>
        )}
        {bookingLoading ? <p className="text-xs uppercase tracking-[0.11em] text-white/52">Loading booking details...</p> : null}
        {bookingError ? <p className="text-xs uppercase tracking-[0.11em] text-rose-300">{bookingError}</p> : null}
      </SectionBlock>

      <SectionBlock description="Jump into the main guest tools. These are UI routes only until API contracts are connected." title="What do you need?">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dashboardCards.map((card, index) => (
            <BentoCard
              key={card.href}
              className={index === 0 ? "lg:col-span-2" : undefined}
              ctaLabel="Open"
              description={card.description}
              href={card.href}
              icon={card.icon}
              sticker={card.sticker}
              title={card.title}
            />
          ))}
        </div>
      </SectionBlock>

      <SectionBlock description="A placeholder for live property notices, events, and useful reminders." sticker={guestStickerTags.notice} title="Notice board">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-[22px] border border-dashed border-white/22 bg-white/[0.035] p-5 shadow-[0_18px_38px_rgba(0,0,0,0.2)] md:p-6">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-white/10 bg-white/[0.05] text-white">
                <PartyPopper className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-suez text-[26px] uppercase leading-none tracking-[-0.03em] text-white">Tonight at the property</h3>
                <p className="mt-3 text-sm leading-7 text-white/64">Event and announcement cards will appear here once connected to real property data.</p>
              </div>
            </div>
          </article>

          <article className="rounded-[22px] border border-dashed border-white/22 bg-white/[0.035] p-5 shadow-[0_18px_38px_rgba(0,0,0,0.2)] md:p-6">
            <ShieldCheck className="h-5 w-5 text-white" />
            <h3 className="mt-4 font-suez text-[24px] uppercase leading-none tracking-[-0.03em] text-white">Stay status</h3>
            <p className="mt-3 text-sm leading-7 text-white/64">Booking status, request updates, and checkout reminders will share this space.</p>
          </article>
        </div>
      </SectionBlock>

      <SectionBlock description="Use this flow to handle visitor entry and gate guidance without blocking current stay actions." title="Gate Access / Visitors">
        <div className="grid gap-4 md:grid-cols-3">
          <BentoCard description="Prepare visitor details at the gate desk or in MyGate once endpoint is available." icon={UserPlus} title="Invite visitor">
            <Button className="h-9 rounded-[12px]" onClick={() => toast.message("Visitor invite API is not connected yet.")} type="button">
              Invite visitor
            </Button>
          </BentoCard>
          <BentoCard description="Show these instructions at the gate: booking ID, guest name, and room assignment." icon={Waypoints} title="Access instructions">
            <p className="text-sm leading-6 text-white/68">
              Share booking ID {activeBooking?.ezee_reservation_id ?? "N/A"}, confirm guest identity, and complete visitor approval at reception.
            </p>
          </BentoCard>
          <BentoCard description="Share access details with co-guests when approved by front desk." icon={ShieldCheck} title="Share access">
            <Button className="h-9 rounded-[12px]" onClick={() => toast.message("Share access flow will use MyGate APIs once available.")} type="button" variant="secondary">
              Share access
            </Button>
          </BentoCard>
        </div>
      </SectionBlock>
    </div>
  );
}
