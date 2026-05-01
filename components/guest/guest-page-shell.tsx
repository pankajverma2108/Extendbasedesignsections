import type { ReactNode } from "react";

import { StickerTag } from "@/components/shared/sticker-tag";
import type { GuestStickerTagConfig } from "@/components/guest/guest-sticker-tags";
import { cn } from "@/lib/utils";

type GuestPageShellProps = {
  title: string;
  description?: string;
  sticker?: GuestStickerTagConfig;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function GuestPageShell({
  title,
  description,
  sticker,
  actions,
  children,
  className,
}: GuestPageShellProps) {
  return (
    <section className={cn("min-h-screen bg-[#07070a] pb-28 pt-24 text-white md:pb-16 md:pt-28", className)}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-7 px-4 md:px-6">
        <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            {sticker ? (
              <StickerTag
                bg={sticker.bg}
                className="px-3 py-1.5 text-[11px] font-bold not-italic uppercase tracking-[0.12em]"
                label={sticker.label}
                rotate={sticker.rotate}
                text={sticker.text}
              />
            ) : null}
            <h1 className="mt-4 font-suez text-[34px] uppercase leading-[0.98] tracking-[-0.03em] text-white md:text-[54px]">
              {title}
            </h1>
            {description ? <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70 md:text-base">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div> : null}
        </header>

        {children}
      </div>
    </section>
  );
}
