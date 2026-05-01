import type { ReactNode } from "react";

import { StickerTag } from "@/components/shared/sticker-tag";
import type { GuestStickerTagConfig } from "@/components/guest/guest-sticker-tags";
import { cn } from "@/lib/utils";

type SectionBlockProps = {
  title: string;
  description?: string;
  sticker?: GuestStickerTagConfig;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function SectionBlock({
  title,
  description,
  sticker,
  action,
  children,
  className,
}: SectionBlockProps) {
  return (
    <section className={cn("space-y-5", className)}>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          {sticker ? (
            <StickerTag
              bg={sticker.bg}
              className="px-3 py-1.5 text-[11px] font-bold not-italic uppercase tracking-[0.12em]"
              label={sticker.label}
              rotate={sticker.rotate}
              text={sticker.text}
            />
          ) : null}
          <h2 className="mt-3 font-suez text-[28px] uppercase leading-[1] tracking-[-0.03em] text-white md:text-[36px]">
            {title}
          </h2>
          {description ? <p className="mt-3 text-sm leading-7 text-white/68 md:text-base">{description}</p> : null}
        </div>
        {action ? <div className="flex shrink-0 flex-wrap items-center gap-3">{action}</div> : null}
      </div>

      {children}
    </section>
  );
}
