"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-bold uppercase transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-[3px] focus-visible:ring-white/30",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--vh-pink)] text-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.18)] hover:-translate-y-0.5",
        outline:
          "border-2 border-white/30 bg-white/10 text-white hover:border-white hover:bg-white/15",
        secondary:
          "bg-white text-[var(--vh-pink)] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:-translate-y-0.5",
        ghost: "text-white hover:bg-white/10",
        link: "text-[var(--vh-pink)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
