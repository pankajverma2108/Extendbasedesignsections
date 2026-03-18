import Link from "next/link";

import type { EventCardProps } from "@/content/types";

import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { FloatCard } from "@/components/shared/motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function EventCard({
  badge,
  capacity,
  date,
  href,
  image,
  location,
  price,
  time,
  title,
}: EventCardProps) {
  return (
    <FloatCard style={{ rotate: "1deg" }}>
      <Card className="overflow-hidden hover:border-white">
        <div className="relative h-[220px] overflow-hidden">
          <ImageWithFallback alt={title} className="h-full w-full object-cover hover:scale-105" src={image} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
          {badge ? (
            <div
              className="absolute right-4 top-4 rounded-[12px] border-2 border-white px-3 py-1 text-[10px] font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,0.25)]"
              style={{ backgroundColor: badge.color }}
            >
              {badge.label}
            </div>
          ) : null}
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-2xl font-bold uppercase text-white">{title}</h3>
          </div>
        </div>

        <CardContent className="space-y-2 py-5 text-sm text-white/80">
          <p>{date}</p>
          <p>{time}</p>
          <p>{location}</p>
          <p>{capacity}</p>
          <div className="rounded-[4px] border-2 border-dashed border-[var(--vh-pink)] bg-[var(--vh-pink)]/10 p-3 text-center font-bold text-[var(--vh-pink)]">
            {price}
          </div>
          <Button asChild className="flex w-full">
            <Link href={href}>RSVP / Book</Link>
          </Button>
        </CardContent>
      </Card>
    </FloatCard>
  );
}
