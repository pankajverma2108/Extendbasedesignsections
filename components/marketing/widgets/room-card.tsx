"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  images,
  price,
  title,
}: RoomCardProps) {
  const gallery = images && images.length > 0 ? images : [image];
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const activeImage = gallery[activeImageIndex] ?? gallery[0] ?? image;

  const goPrevious = () => {
    setActiveImageIndex((current) => (current - 1 + gallery.length) % gallery.length);
  };

  const goNext = () => {
    setActiveImageIndex((current) => (current + 1) % gallery.length);
  };

  return (
    <FloatCard style={{ rotate: "-0.5deg" }}>
      <Card className="overflow-hidden border-white/12 hover:border-[var(--vh-pink)]" style={{ backgroundColor: "#10111a" }}>
        <div className="relative h-[240px] overflow-hidden">
          <ImageWithFallback alt={title} className="h-full w-full object-cover hover:scale-105" src={activeImage} />

          {gallery.length > 1 ? (
            <>
              <button
                aria-label="Previous image"
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-black/35 p-1.5 text-white/90"
                onClick={goPrevious}
                type="button"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                aria-label="Next image"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-black/35 p-1.5 text-white/90"
                onClick={goNext}
                type="button"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          ) : null}

          {badge && badge.label.toLowerCase() !== "details on arrival" ? (
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

          {gallery.length > 1 ? (
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/20 bg-black/35 px-2 py-1">
              {gallery.map((item, index) => (
                <button
                  key={`${item}-${index}`}
                  aria-label={`Show image ${index + 1}`}
                  className={`h-1.5 w-1.5 rounded-full ${index === activeImageIndex ? "bg-white" : "bg-white/45"}`}
                  onClick={() => setActiveImageIndex(index)}
                  type="button"
                />
              ))}
            </div>
          ) : null}
        </div>

        <CardContent className="pt-3">
          <h3 className="text-2xl font-bold uppercase text-white">{title}</h3>

          <ul className="mt-3 flex flex-wrap gap-2 text-xs text-white/85">
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
            <p className="text-2xl font-bold text-[#c62828]">{price}</p>
          </div>
          <Button asChild variant="outline">
            <Link href={href}>View Details</Link>
          </Button>
        </CardFooter>
      </Card>
    </FloatCard>
  );
}
