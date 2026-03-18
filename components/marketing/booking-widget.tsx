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

export function BookingWidget({
  destinationHref = "/rooms",
  initialCheckIn = "",
  initialCheckOut = "",
  submitLabel = "Check Dates",
  variant = "inline",
}: BookingWidgetProps) {
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);

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

  return (
    <div className={cn("rounded-[8px] text-slate-900 shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.14)]", variantClasses[variant])}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block text-center">
          <span className="mb-2 block text-[10px] font-bold uppercase tracking-[1px] text-slate-900">
            Check-In
          </span>
          <input
            className="vh-input"
            min={new Date().toISOString().slice(0, 10)}
            onChange={(event) => setCheckIn(event.target.value)}
            type="date"
            value={checkIn}
          />
        </label>

        <label className="block text-center">
          <span className="mb-2 block text-[10px] font-bold uppercase tracking-[1px] text-slate-900">
            Check-Out
          </span>
          <input
            className="vh-input"
            min={checkIn || new Date().toISOString().slice(0, 10)}
            onChange={(event) => setCheckOut(event.target.value)}
            type="date"
            value={checkOut}
          />
        </label>
      </div>

      <p className={cn("mt-3 min-h-5 text-center text-xs", isValid ? "text-emerald-600" : "text-rose-600")}>
        {isValid ? "Dates look good. Continue to room selection." : validationMessage}
      </p>

      <Button
        aria-disabled={!isValid}
        asChild
        className={cn("mt-3 flex w-full", !isValid && "pointer-events-none bg-slate-400 shadow-none hover:translate-y-0")}
      >
        <Link href={destinationHref}>{submitLabel}</Link>
      </Button>
    </div>
  );
}
