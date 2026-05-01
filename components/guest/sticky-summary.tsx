import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StickySummaryItem = {
  label: string;
  value: string;
};

type StickySummaryProps = {
  title?: string;
  items?: StickySummaryItem[];
  ctaLabel?: string;
  className?: string;
};

const placeholderItems: StickySummaryItem[] = [
  { label: "Add-ons", value: "0 selected" },
  { label: "Borrow", value: "0 items" },
  { label: "Requests", value: "None yet" },
];

export function StickySummary({
  title = "Stay summary",
  items = placeholderItems,
  ctaLabel = "Review actions",
  className,
}: StickySummaryProps) {
  return (
    <aside
      className={cn(
        "fixed bottom-[92px] left-4 right-4 z-30 rounded-[22px] border border-dashed border-white/22 bg-[#07070a] p-4 shadow-[0_22px_56px_rgba(0,0,0,0.38)] lg:sticky lg:top-28 lg:left-auto lg:right-auto lg:z-auto lg:self-start",
        className,
      )}
    >
      <h3 className="font-suez text-[24px] uppercase leading-none tracking-[-0.03em] text-white">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-4 rounded-[14px] border border-white/10 bg-white/[0.04] px-3 py-2">
            <span className="text-xs font-bold uppercase tracking-[0.1em] text-white/54">{item.label}</span>
            <span className="text-sm font-semibold text-white">{item.value}</span>
          </div>
        ))}
      </div>
      <Button className="mt-4 h-10 w-full rounded-[14px] bg-[#c92420] text-white hover:bg-[#a91d1a]" type="button">
        {ctaLabel}
      </Button>
    </aside>
  );
}
