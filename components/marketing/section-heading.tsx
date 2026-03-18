import { FadeIn } from "@/components/shared/motion";

type SectionHeadingProps = {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
};

export function SectionHeading({
  title,
  subtitle,
  align = "center",
}: SectionHeadingProps) {
  const alignment = align === "center" ? "text-center" : "text-left";

  return (
    <FadeIn className={`mb-8 ${alignment}`}>
      <h2 className="vh-title">{title}</h2>
      {subtitle ? <p className="vh-subtitle mt-2">{subtitle}</p> : null}
    </FadeIn>
  );
}
