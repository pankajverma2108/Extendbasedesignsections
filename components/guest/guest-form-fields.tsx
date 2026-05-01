"use client";

import type { ComponentProps, ReactNode } from "react";
import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FieldChromeProps = {
  label: string;
  helper?: string;
  error?: string;
  children: ReactNode;
  className?: string;
};

function FieldChrome({ label, helper, error, children, className }: FieldChromeProps) {
  return (
    <label className={cn("block space-y-2", className)}>
      <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/62">{label}</span>
      {children}
      {error ? <span className="block text-xs leading-5 text-red-200">{error}</span> : helper ? <span className="block text-xs leading-5 text-white/46">{helper}</span> : null}
    </label>
  );
}

export function GuestTextField({
  label,
  helper,
  error,
  className,
  ...props
}: ComponentProps<"input"> & {
  label: string;
  helper?: string;
  error?: string;
}) {
  return (
    <FieldChrome className={className} error={error} helper={helper} label={label}>
      <input
        className="h-12 w-full rounded-[14px] border border-white/12 bg-white/[0.05] px-4 text-sm text-white outline-none transition duration-300 placeholder:text-white/32 focus:border-[#c92420] focus:bg-white/[0.07] focus:shadow-[0_0_0_3px_rgba(201,36,32,0.22)]"
        {...props}
      />
    </FieldChrome>
  );
}

export function GuestTextArea({
  label,
  helper,
  error,
  className,
  ...props
}: ComponentProps<"textarea"> & {
  label: string;
  helper?: string;
  error?: string;
}) {
  return (
    <FieldChrome className={className} error={error} helper={helper} label={label}>
      <textarea
        className="min-h-32 w-full resize-y rounded-[14px] border border-white/12 bg-white/[0.05] px-4 py-3 text-sm leading-6 text-white outline-none transition duration-300 placeholder:text-white/32 focus:border-[#c92420] focus:bg-white/[0.07] focus:shadow-[0_0_0_3px_rgba(201,36,32,0.22)]"
        {...props}
      />
    </FieldChrome>
  );
}

export function GuestQuantityField({
  label,
  value,
  onDecrease,
  onIncrease,
  helper,
  className,
}: {
  label: string;
  value: number;
  onDecrease?: () => void;
  onIncrease?: () => void;
  helper?: string;
  className?: string;
}) {
  return (
    <FieldChrome className={className} helper={helper} label={label}>
      <div className="flex h-12 items-center justify-between rounded-[14px] border border-white/12 bg-white/[0.05] px-2">
        <Button className="h-8 w-8 rounded-full border border-white/10 bg-white/5 p-0 text-white hover:bg-white/10" onClick={onDecrease} type="button">
          <Minus className="h-4 w-4" />
          <span className="sr-only">Decrease quantity</span>
        </Button>
        <span className="min-w-10 text-center text-sm font-bold text-white">{value}</span>
        <Button className="h-8 w-8 rounded-full border border-white/10 bg-white/5 p-0 text-white hover:bg-white/10" onClick={onIncrease} type="button">
          <Plus className="h-4 w-4" />
          <span className="sr-only">Increase quantity</span>
        </Button>
      </div>
    </FieldChrome>
  );
}
