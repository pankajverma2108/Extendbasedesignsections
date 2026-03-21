import { FadeIn } from "@/components/shared/motion";

type SectionHeadingProps = {
  title: string;
  subtitle?: string;
  tagline?: string;
  align?: "left" | "center";
};

export function SectionHeading({
  title,
  subtitle,
  tagline,
  align = "center",
}: SectionHeadingProps) {
  const alignment = align === "center" ? "text-center" : "text-left";

  return (
    <FadeIn className={`mb-8 ${alignment}`}>
      <h2 className="vh-title">{title}</h2>
      {subtitle ? <p className="vh-subtitle mt-2">{subtitle}</p> : null}
      {tagline ? <p className="mx-auto mt-3 max-w-[640px] text-sm leading-6 text-slate-300">{tagline}</p> : null}
    </FadeIn>
  );
}
