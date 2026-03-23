"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 text-white", className)}
      classNames={{
        months: "flex flex-col gap-4 sm:flex-row",
        month: "space-y-4",
        caption: "relative flex items-center justify-center pt-1",
        caption_label: "text-sm font-semibold text-white",
        nav: "flex items-center gap-2",
        nav_button:
          "inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/78 hover:border-white/30 hover:bg-white/10 hover:text-white",
        nav_button_previous: "absolute left-0",
        nav_button_next: "absolute right-0",
        table: "w-full border-collapse",
        head_row: "flex",
        head_cell: "w-9 rounded-md text-[11px] font-semibold uppercase tracking-[0.08em] text-white/45",
        row: "mt-2 flex w-full",
        cell: cn(
          "relative h-9 w-9 p-0 text-center text-sm [&:has([aria-selected].day-range-end)]:rounded-r-full [&:has([aria-selected].day-range-start)]:rounded-l-full",
          props.mode === "range"
            ? "[&:has([aria-selected].day-range-middle)]:bg-white/8 [&:has([aria-selected])]:bg-white/8"
            : "",
        ),
        day: "flex h-9 w-9 items-center justify-center rounded-full text-sm text-white/82 hover:bg-white/10 hover:text-white",
        day_range_start: "day-range-start bg-[var(--vh-pink)] text-white hover:bg-[var(--vh-pink)]",
        day_range_end: "day-range-end bg-[var(--vh-pink)] text-white hover:bg-[var(--vh-pink)]",
        day_selected: "bg-[var(--vh-pink)] text-white hover:bg-[var(--vh-pink)]",
        day_today: "border border-[var(--vh-cyan)] text-[var(--vh-cyan)]",
        day_outside: "text-white/25",
        day_disabled: "cursor-not-allowed text-white/20",
        day_range_middle: "rounded-none bg-white/10 text-white",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ className, orientation, ...componentProps }) =>
          orientation === "left" ? (
            <ChevronLeft className={cn("h-4 w-4", className)} {...componentProps} />
          ) : (
            <ChevronRight className={cn("h-4 w-4", className)} {...componentProps} />
          ),
      }}
      {...props}
    />
  );
}

export { Calendar };
