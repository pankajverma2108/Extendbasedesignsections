import { cn } from "@/lib/utils";

type StickerTagProps = {
  label: string;
  bg?: string;
  text?: string;
  rotate?: string;
  className?: string;
};

export function StickerTag({
  label,
  bg = "#FEF08A",
  text = "#000000",
  rotate = "rotate-[10deg]",
  className,
}: StickerTagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[2px] border border-black/10 px-2 py-1 text-xs italic leading-4 shadow-[0px_2px_4px_-2px_rgba(0,0,0,0.1),0px_4px_6px_-1px_rgba(0,0,0,0.1)]",
        rotate,
        className,
      )}
      style={{ backgroundColor: bg, color: text }}
    >
      {label}
    </span>
  );
}