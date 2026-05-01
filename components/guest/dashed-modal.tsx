"use client";

import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { StickerTag } from "@/components/shared/sticker-tag";
import { Button } from "@/components/ui/button";
import type { GuestStickerTagConfig } from "@/components/guest/guest-sticker-tags";
import { cn } from "@/lib/utils";

type DashedModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  sticker?: GuestStickerTagConfig;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function DashedModal({
  open,
  onOpenChange,
  title,
  description,
  sticker,
  children,
  footer,
  className,
}: DashedModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              <motion.div
                className={cn(
                  "fixed left-1/2 top-1/2 z-50 flex max-h-[86vh] w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[24px] border border-dashed border-white/28 bg-[#07070a] text-white shadow-[0_28px_70px_rgba(0,0,0,0.45)]",
                  className,
                )}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.24, ease: "easeOut" }}
              >
                <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5 md:p-6">
                  <div>
                    {sticker ? (
                      <StickerTag
                        bg={sticker.bg}
                        className="px-3 py-1.5 text-[10px] font-bold not-italic uppercase tracking-[0.12em]"
                        label={sticker.label}
                        rotate={sticker.rotate}
                        text={sticker.text}
                      />
                    ) : null}
                    <Dialog.Title className="mt-3 font-suez text-[26px] uppercase leading-[1] tracking-[-0.03em] text-white">
                      {title}
                    </Dialog.Title>
                    {description ? <Dialog.Description className="mt-2 text-sm leading-6 text-white/68">{description}</Dialog.Description> : null}
                  </div>
                  <Dialog.Close asChild>
                    <Button className="h-9 w-9 rounded-full border border-white/10 bg-white/5 p-0 text-white hover:bg-white/10" type="button">
                      <X className="h-4 w-4" />
                      <span className="sr-only">Close modal</span>
                    </Button>
                  </Dialog.Close>
                </div>

                <div className="overflow-y-auto p-5 md:p-6">{children}</div>

                {footer ? <div className="border-t border-white/10 bg-white/[0.03] p-4 md:p-5">{footer}</div> : null}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}
