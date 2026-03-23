import Link from "next/link";

import type { RoomCardProps } from "@/content/types";

import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { FloatCard } from "@/components/shared/motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export function RoomCard({
  badge,
  features,
  href,
  image,
  occupancy,
  price,
  title,
}: RoomCardProps) {
  return (
    <FloatCard style={{ rotate: "-0.5deg" }}>
      <Card className="overflow-hidden border-white/12 hover:border-[var(--vh-pink)]" style={{ backgroundColor: "#211122" }}>
        <div className="relative h-[240px] overflow-hidden">
          <ImageWithFallback alt={title} className="h-full w-full object-cover hover:scale-105" src={image} />
          {badge ? (
            <div
              className="absolute left-4 top-4 rounded-[3px] border-2 border-[var(--vh-surface-2)] px-3 py-1 text-[10px] font-bold uppercase"
              style={{
                backgroundColor: badge.color,
                color: badge.textColor || "#ffffff",
              }}
            >
              {badge.label}
            </div>
          ) : null}
        </div>

        <CardContent className="pt-5">
          <h3 className="text-2xl font-bold uppercase text-white">{title}</h3>
          <p className="mt-2 text-sm text-white/70">{occupancy}</p>

          <ul className="mt-4 flex flex-wrap gap-2 text-xs text-white/85">
            {features.slice(0, 10).map((feature, index) => (
              <li
                key={`${feature}-${index}`}
                className="rounded-full border border-white/12 bg-white/7 px-2.5 py-1 leading-5"
              >
                {feature}
              </li>
            ))}
          </ul>
        </CardContent>

        <CardFooter className="mt-auto flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase text-white/60">Starting from</p>
            <p className="text-2xl font-bold text-[#ff2e62]">{price}</p>
          </div>
          <Button asChild variant="outline">
            <Link href={href}>View Details</Link>
          </Button>
        </CardFooter>
      </Card>
    </FloatCard>
  );
}
