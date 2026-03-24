"use client";

import Link from "next/link";
import { forwardRef, useMemo, useState } from "react";
import type { ComponentPropsWithoutRef } from "react";
import type { DateRange } from "react-day-picker";
import { ArrowRight, CalendarDays, ChevronDown } from "lucide-react";

import type { BookingWidgetProps } from "@/content/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const variantClasses: Record<NonNullable<BookingWidgetProps["variant"]>, string> = {
  hero: "",
  cta: "rounded-[24px] border border-white/12 bg-white/95 p-4 text-slate-900 shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.14)]",
  inline: "rounded-[20px] border border-white/15 bg-white/95 p-4 text-slate-900 shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.14)]",
};

function getLocalDate(days: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
}

function toInputDateString(date?: Date) {
  if (!date) {
    return "";
  }

  const normalized = new Date(date);
  normalized.setHours(12, 0, 0, 0);

  const year = normalized.getFullYear();
  const month = String(normalized.getMonth() + 1).padStart(2, "0");
  const day = String(normalized.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatShortDate(date?: Date) {
  if (!date) {
    return "Select";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function getNightCount(dateRange?: DateRange) {
  if (!dateRange?.from || !dateRange?.to) {
    return 1;
  }

  return Math.max(1, Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / 86400000));
}

type DateSummaryButtonProps = ComponentPropsWithoutRef<"button"> & {
  dateRange: DateRange | undefined;
  open: boolean;
  variant: NonNullable<BookingWidgetProps["variant"]>;
};

const DateSummaryButton = forwardRef<HTMLButtonElement, DateSummaryButtonProps>(function DateSummaryButton(
  {
    className,
    dateRange,
    open,
    variant,
    ...props
  },
  ref,
) {
  const nights = getNightCount(dateRange);
  const tone =
    variant === "hero"
      ? {
          wrapper: "border-white/12 bg-[rgba(15,16,26,0.86)] text-white hover:border-white/20",
          label: "text-white/54",
          value: "text-white",
        }
      : {
          wrapper: "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300 hover:bg-white",
          label: "text-slate-500",
          value: "text-slate-900",
        };

  return (
    <button
      ref={ref}
      {...props}
      aria-expanded={open}
      className={cn(
        "flex w-full items-center justify-between gap-4 rounded-[24px] border text-left",
        variant === "hero" ? "px-5 py-4 md:px-6" : "px-4 py-4",
        tone.wrapper,
        className,
      )}
    >
      <div className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] items-center gap-3 md:gap-5">
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-current/10 bg-white/6 text-[var(--vh-cyan)]">
          <CalendarDays className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className={cn("text-[10px] font-bold uppercase tracking-[0.14em]", tone.label)}>Check-In</p>
          <p className={cn("mt-1 text-sm font-semibold", tone.value)}>{formatShortDate(dateRange?.from)}</p>
        </div>
        <div className="min-w-0 border-l border-white/10 pl-3 md:pl-5">
          <p className={cn("text-[10px] font-bold uppercase tracking-[0.14em]", tone.label)}>Check-Out</p>
          <p className={cn("mt-1 text-sm font-semibold", tone.value)}>{formatShortDate(dateRange?.to)}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden rounded-full bg-[var(--vh-amber)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-950 md:inline-flex">
          {nights} {nights === 1 ? "Night" : "Nights"}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform",
            variant === "hero" ? "text-white/60" : "text-slate-500",
            open && "rotate-180",
          )}
        />
      </div>
    </button>
  );
});

export function BookingWidget({
  destinationHref = "/property",
  initialCheckIn = "",
  initialCheckOut = "",
  submitLabel = "Check Dates",
  variant = "inline",
}: BookingWidgetProps) {
  const initialFrom = initialCheckIn ? new Date(`${initialCheckIn}T12:00:00`) : getLocalDate(0);
  const initialTo = initialCheckOut ? new Date(`${initialCheckOut}T12:00:00`) : getLocalDate(1);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: initialFrom,
    to: initialTo < initialFrom ? initialFrom : initialTo,
  });
  const [open, setOpen] = useState(false);

  const checkIn = toInputDateString(dateRange?.from);
  const checkOut = toInputDateString(dateRange?.to);
  const validationMessage = useMemo(() => {
    if (!checkIn || !checkOut) {
      return "Select check-in and check-out dates.";
    }

    if (checkOut <= checkIn) {
      return "Check-out must be after check-in.";
    }

    return "";
  }, [checkIn, checkOut]);

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

  if (variant === "hero") {
    return (
      <div className="w-full">
        <div className="rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(29,18,26,0.92),rgba(18,11,18,0.96))] p-4 shadow-[0_30px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl md:p-5">
          <Popover onOpenChange={setOpen} open={open}>
            <PopoverTrigger asChild>
              <DateSummaryButton dateRange={dateRange} open={open} variant={variant} />
            </PopoverTrigger>
            <PopoverContent
              align="center"
              className="z-[200] w-[min(100vw-2rem,380px)] border-white/10 bg-[var(--vh-panel-strong)] p-3"
            >
              <Calendar
                className="vh-calendar-dark rounded-[22px]"
                defaultMonth={dateRange?.from}
                mode="range"
                numberOfMonths={1}
                onSelect={(nextValue) => {
                  if (!nextValue?.from) {
                    return;
                  }

                  const fallbackTo = nextValue.to ?? dateRange?.to ?? getLocalDate(1);
                  const normalizedTo = fallbackTo < nextValue.from ? nextValue.from : fallbackTo;

                  setDateRange({
                    from: nextValue.from,
                    to: normalizedTo,
                  });

                  if (nextValue?.from && nextValue?.to) {
                    setOpen(false);
                  }
                }}
                selected={dateRange}
                disabled={{ before: getLocalDate(0) }}
              />
            </PopoverContent>
          </Popover>

          <Button
            aria-disabled={validationMessage.length > 0}
            asChild
            className={cn(
              "mt-4 flex h-14 w-full rounded-[20px] text-base shadow-[0_18px_45px_rgba(255,46,98,0.28)]",
              validationMessage.length > 0 && "pointer-events-none bg-slate-500 shadow-none hover:translate-y-0",
            )}
          >
            <Link href={destinationWithDates}>
              {submitLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <p className="mt-3 text-center text-sm font-semibold text-white/72">
            Lock the dates now. Sort the rest when you get here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={variantClasses[variant]}>
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger asChild>
          <DateSummaryButton dateRange={dateRange} open={open} variant={variant} />
        </PopoverTrigger>
        <PopoverContent
          align="center"
          className="z-[200] w-[min(100vw-2rem,420px)] border-white/10 bg-[var(--vh-panel-strong)] p-3"
        >
          <Calendar
            className="vh-calendar-dark rounded-[22px]"
            defaultMonth={dateRange?.from}
            mode="range"
            numberOfMonths={1}
            onSelect={(nextValue) => {
              if (!nextValue?.from) {
                return;
              }

              const fallbackTo = nextValue.to ?? dateRange?.to ?? getLocalDate(1);
              const normalizedTo = fallbackTo < nextValue.from ? nextValue.from : fallbackTo;

              setDateRange({
                from: nextValue.from,
                to: normalizedTo,
              });

              if (nextValue?.from && nextValue?.to) {
                setOpen(false);
              }
            }}
            selected={dateRange}
            disabled={{ before: getLocalDate(0) }}
          />
        </PopoverContent>
      </Popover>

      <Button
        aria-disabled={validationMessage.length > 0}
        asChild
        className={cn(
          "mt-3 flex w-full rounded-[18px]",
          validationMessage.length > 0 && "pointer-events-none bg-slate-400 shadow-none hover:translate-y-0",
        )}
      >
        <Link href={destinationWithDates}>{submitLabel}</Link>
      </Button>
    </div>
  );
}
