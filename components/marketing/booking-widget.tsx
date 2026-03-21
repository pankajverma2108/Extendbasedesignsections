"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { BookingWidgetProps } from "@/content/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const variantClasses: Record<NonNullable<BookingWidgetProps["variant"]>, string> = {
  hero: "max-w-[520px] border-2 border-[var(--vh-pink)] bg-white p-5 md:p-6",
  cta: "bg-white p-5",
  inline: "border-2 border-white/20 bg-white/95 p-4",
};

const chipClasses: Record<NonNullable<BookingWidgetProps["variant"]>, string> = {
  hero: "bg-[#393630] text-[#f8f2e8]",
  cta: "bg-[#393630] text-[#f8f2e8]",
  inline: "bg-slate-800 text-white",
};

function getLocalDateOffset(days: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function BookingWidget({
  destinationHref = "/property",
  initialCheckIn = "",
  initialCheckOut = "",
  submitLabel = "Check Dates",
  variant = "inline",
  urgencyChips,
}: BookingWidgetProps) {
  const [checkIn, setCheckIn] = useState(initialCheckIn || getLocalDateOffset(0));
  const [checkOut, setCheckOut] = useState(initialCheckOut || getLocalDateOffset(1));

  const validationMessage = useMemo(() => {
    if (!checkIn || !checkOut) {
      return "Select check-in and check-out dates.";
    }

    if (checkOut <= checkIn) {
      return "Check-out must be after check-in.";
    }

    return "";
  }, [checkIn, checkOut]);

  const isValid = validationMessage.length === 0;

  const destinationWithDates = useMemo(() => {
    const params = new URLSearchParams();

    if (checkIn) {
      params.set("checkin", checkIn);
    }

    if (checkOut) {
      params.set("checkout", checkOut);
    }

    const query = params.toString();

    return query ? `${destinationHref}?${query}` : destinationHref;
  }, [checkIn, checkOut, destinationHref]);

  return (
    <div className={cn("rounded-[8px] text-slate-900 shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.14)]", variantClasses[variant])}>
      {urgencyChips && urgencyChips.length > 0 ? (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {urgencyChips.map((chip) => (
            <span
              key={chip}
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]",
                chipClasses[variant],
              )}
            >
              {chip}
            </span>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-left">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[1px] text-slate-900">
            Check-In
          </span>
          <input
            className="vh-input"
            min={getLocalDateOffset(0)}
            onChange={(event) => setCheckIn(event.target.value)}
            type="date"
            value={checkIn}
          />
        </label>

        <label className="block text-left">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[1px] text-slate-900">
            Check-Out
          </span>
          <input
            className="vh-input"
            min={checkIn || getLocalDateOffset(1)}
            onChange={(event) => setCheckOut(event.target.value)}
            type="date"
            value={checkOut}
          />
        </label>
      </div>

      <Button
        aria-disabled={!isValid}
        asChild
        className={cn(
          "mt-3 flex w-full",
          !isValid && "pointer-events-none bg-slate-400 shadow-none hover:translate-y-0",
        )}
      >
        <Link href={destinationWithDates}>{submitLabel}</Link>
      </Button>
    </div>
  );
}
