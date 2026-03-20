import type { ReactNode } from "react";

import {
  amenities,
  assurances,
  experienceCards,
  guestEnergyImages,
  homePageContent,
  homeSectionOrder,
  type HomeSectionId,
  testimonials,
  upsellBentoItems,
} from "@/content/home";
import { BookingWidget } from "@/components/marketing/booking-widget";
import { EventCard } from "@/components/marketing/event-card";
import { RoomCard } from "@/components/marketing/room-card";
import { SectionHeading } from "@/components/marketing/section-heading";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { FadeIn, FloatCard, Stagger, StaggerItem } from "@/components/shared/motion";
import { StickerTag } from "@/components/shared/sticker-tag";
import { StarBorder } from "@/components/shared/star-border";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type SectionFrameProps = {
  alt?: boolean;
  children: ReactNode;
};

function SectionFrame({ alt = false, children }: SectionFrameProps) {
  return <section className={alt ? "vh-section vh-section-alt" : "vh-section"}>{children}</section>;
}

function TrustSection() {
  return (
    <SectionFrame>
      <div className="vh-container">
        <SectionHeading subtitle={homePageContent.trustSubtitle} title={homePageContent.trustTitle} />
        <Stagger className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {assurances.map((item, index) => (
            <StaggerItem key={item.label}>
              <FloatCard whileHover={{ y: -4, rotate: 0, scale: 1.02 }}>
                <StarBorder
                  className="w-full"
                  color={item.color}
                  innerClassName="p-4 text-center"
                  speed="7s"
                  style={{ transform: index % 2 === 0 ? "rotate(-1deg)" : "rotate(1deg)" }}
                >
                  <p className="text-sm font-bold uppercase text-white">{item.label}</p>
                </StarBorder>
              </FloatCard>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </SectionFrame>
  );
}

function AmenitiesSection() {
  return (
    <SectionFrame alt>
      <div className="vh-container">
        <SectionHeading subtitle={homePageContent.amenitiesSubtitle} title={homePageContent.amenitiesTitle} />
        <Stagger className="flex flex-wrap justify-center gap-3">
          {amenities.map((item, index) => (
            <StaggerItem key={item.label}>
              <FloatCard
                className="rounded-[12px] border-2 border-white/30 bg-white/10 px-4 py-3 text-sm font-bold uppercase text-white hover:border-white"
                style={{ color: item.color, rotate: `${(index % 3) - 1}deg` }}
              >
                <span className="text-white">{item.label}</span>
              </FloatCard>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </SectionFrame>
  );
}

function RoomsSection() {
  return (
    <SectionFrame>
      <div className="vh-container">
        <SectionHeading subtitle={homePageContent.roomsSubtitle} title={homePageContent.roomsTitle} />
        <Stagger className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {homePageContent.homeRooms.map((room) => (
            <StaggerItem key={room.title}>
              <RoomCard {...room} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </SectionFrame>
  );
}

function EventsSection() {
  return (
    <SectionFrame alt>
      <div className="vh-container">
        <SectionHeading subtitle={homePageContent.eventsSubtitle} title={homePageContent.eventsTitle} />
        <Stagger className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {homePageContent.homeEvents.map((event) => (
            <StaggerItem key={event.title}>
              <EventCard {...event} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </SectionFrame>
  );
}

function UpsellSection() {
  const toneStyles = {
    pink: { border: "#ff2e62", accent: "#ff2e62", sticker: "#FEF08A", text: "#0f172a" },
    blue: { border: "#00d1ff", accent: "#00d1ff", sticker: "#00d1ff", text: "#0f172a" },
    green: { border: "#39ff14", accent: "#39ff14", sticker: "#39ff14", text: "#0f172a" },
  } as const;

  return (
    <SectionFrame alt>
      <div className="vh-container">
        <SectionHeading subtitle={homePageContent.upsellSubtitle} title={homePageContent.upsellTitle} />
        <Stagger className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {upsellBentoItems.map((item, index) => {
            const tone = toneStyles[item.tone];

            return (
              <StaggerItem key={item.id}>
                <div
                  className="group relative rounded-[12px] border-2 bg-[#1e293b] p-8 text-left transition-all hover:border-white"
                  style={{ borderColor: "#334155", transform: `rotate(${index % 2 === 0 ? -1 : 1}deg)` }}
                >
                  <StickerTag
                    bg={tone.sticker}
                    className="absolute left-4 top-4 rounded-[3px] border-2 border-[var(--vh-surface-2)] px-3 py-1 text-[10px] font-bold not-italic uppercase"
                    label={item.kicker}
                    rotate={index % 2 === 0 ? "rotate-[2deg]" : "rotate-[-2deg]"}
                    text={tone.text}
                  />

                  <div
                    className="mb-6 mt-8 inline-flex rounded-full p-4 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${tone.accent}22`, color: tone.accent }}
                  >
                    <span className="h-5 w-5 rounded-full" style={{ backgroundColor: tone.accent }} />
                  </div>

                  <h3 className="mb-3 text-[24px] font-bold uppercase text-white">{item.title}</h3>
                  <p className="text-sm leading-6 text-white/80">{item.body}</p>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </SectionFrame>
  );
}

function ExperienceSection() {
  return (
    <SectionFrame>
      <div className="vh-container">
        <SectionHeading subtitle={homePageContent.experienceSubtitle} title={homePageContent.experienceTitle} />
        <Stagger className="mx-auto grid max-w-screen-md grid-cols-1 gap-6 md:grid-cols-2">
          {experienceCards.map((item, index) => (
            <StaggerItem key={item.title}>
              <FloatCard
                className="rounded-[8px] border-2 p-6 shadow-[8px_8px_0px_0px_rgba(255,255,255,0.18)]"
                style={{
                  background: index === 0
                    ? "linear-gradient(135deg, #ff2e62, #ff6b98)"
                    : "linear-gradient(135deg, #39ff14, #6fff47)",
                  borderColor: index === 0 ? "#ffffff" : "#0f172a",
                  color: item.darkText ? "#0f172a" : "#ffffff",
                  rotate: index === 0 ? "-1deg" : "1deg",
                }}
              >
                <h3 className="mb-4 text-xl font-bold uppercase">{item.title}</h3>
                <p className="text-sm leading-6">{item.body}</p>
              </FloatCard>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </SectionFrame>
  );
}

function EnergySection() {
  return (
    <SectionFrame alt>
      <div className="vh-container">
        <SectionHeading subtitle={homePageContent.energySubtitle} title={homePageContent.energyTitle} />
        <Stagger className="mx-auto mb-8 grid max-w-screen-lg grid-cols-2 gap-4 md:grid-cols-4">
          {guestEnergyImages.map((image, index) => (
            <StaggerItem key={image}>
              <FloatCard
                className="overflow-hidden rounded-[4px] border-4 border-white shadow-[8px_8px_0px_0px_#ff2e62]"
                style={{ rotate: `${index % 2 === 0 ? -2 : 2}deg` }}
              >
                <ImageWithFallback
                  alt={`Guest energy ${index + 1}`}
                  className="aspect-square w-full object-cover hover:scale-110"
                  src={image}
                />
              </FloatCard>
            </StaggerItem>
          ))}
        </Stagger>
        <FadeIn className="text-center">
          <Button asChild size="lg">
            <a href="https://instagram.com/vibehouse">@VibeHouse</a>
          </Button>
        </FadeIn>
      </div>
    </SectionFrame>
  );
}

function ReviewsSection() {
  return (
    <SectionFrame>
      <div className="vh-container">
        <SectionHeading subtitle={homePageContent.reviewsSubtitle} title={homePageContent.reviewsTitle} />
        <Stagger className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((review, index) => (
            <StaggerItem key={review.name}>
              <FloatCard style={{ rotate: `${index % 2 === 0 ? -0.5 : 0.5}deg` }}>
                <Card className="hover:border-[var(--vh-pink)]">
                  <CardContent className="p-5">
                    <p className="text-lg font-bold text-white">{review.name}</p>
                    <p className="text-xs text-white/60">{review.country}</p>
                    <p className="mt-4 text-sm italic leading-6 text-white/85">"{review.review}"</p>
                  </CardContent>
                </Card>
              </FloatCard>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </SectionFrame>
  );
}

function CtaSection() {
  return (
    <SectionFrame alt>
      <div className="vh-container">
        <FadeIn className="mx-auto max-w-[520px] rounded-[12px] border-4 border-white bg-gradient-to-br from-[var(--vh-pink)] via-[var(--vh-pink-soft)] to-[var(--vh-pink)] p-6 shadow-[12px_12px_0px_0px_rgba(255,255,255,0.25)]">
          <SectionHeading subtitle={homePageContent.ctaBody} title={homePageContent.ctaTitle} />
          <BookingWidget
            destinationHref="/rooms"
            submitLabel="Book Now"
            urgencyChips={homePageContent.ctaUrgencyChips}
            variant="cta"
          />
          <p className="mt-4 text-center text-xs font-bold uppercase tracking-[1px] text-white">
            Free Cancellation | No Booking Fees
          </p>
        </FadeIn>
      </div>
    </SectionFrame>
  );
}

const homeSectionComponents: Record<HomeSectionId, () => ReactNode> = {
  trust: TrustSection,
  amenities: AmenitiesSection,
  rooms: RoomsSection,
  upsell: UpsellSection,
  events: EventsSection,
  experience: ExperienceSection,
  energy: EnergySection,
  reviews: ReviewsSection,
  cta: CtaSection,
};

export function HomeSections({ order = homeSectionOrder }: { order?: HomeSectionId[] }) {
  return (
    <>
      {order.map((sectionId) => {
        const SectionComponent = homeSectionComponents[sectionId];
        return <SectionComponent key={sectionId} />;
      })}
    </>
  );
}
