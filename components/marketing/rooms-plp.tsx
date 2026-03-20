"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BedDouble,
  Briefcase,
  Camera,
  Clock3,
  MapPin,
  Music2,
  Shield,
  Snowflake,
  Sparkles,
  Users,
  Utensils,
  Wifi,
} from "lucide-react";

import {
  houseRules,
  importantInfo,
  includedAssurances,
  locationMap,
  nearbyAttractions,
  propertyAmenities,
  propertyGallery,
  propertyOverview,
  roomCategories,
  roomFaqs,
  roomListingLegend,
  socialSpaces,
} from "@/content/rooms";
import { siteMeta } from "@/content/site";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { FadeIn, Stagger, StaggerItem } from "@/components/shared/motion";
import { StickerTag } from "@/components/shared/sticker-tag";
import { SectionHeading } from "@/components/marketing/section-heading";
import { BookingWidget } from "@/components/marketing/booking-widget";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const amenityIcons = {
  wifi: Wifi,
  snowflake: Snowflake,
  shield: Shield,
  bed: BedDouble,
  sparkles: Sparkles,
  utensils: Utensils,
  music: Music2,
  briefcase: Briefcase,
  camera: Camera,
  clock: Clock3,
  "map-pin": MapPin,
  users: Users,
} as const;

function getLocalDateOffset(days: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function buildRoomsHref(checkIn: string, checkOut: string): string {
  const params = new URLSearchParams();

  if (checkIn) {
    params.set("checkin", checkIn);
  }

  if (checkOut) {
    params.set("checkout", checkOut);
  }

  const query = params.toString();
  return query ? `/rooms?${query}` : "/rooms";
}

type RoomsPlpProps = {
  initialCheckIn?: string;
  initialCheckOut?: string;
};

export function RoomsPlp({ initialCheckIn, initialCheckOut }: RoomsPlpProps) {
  const [checkIn, setCheckIn] = useState(initialCheckIn || getLocalDateOffset(0));
  const [checkOut, setCheckOut] = useState(initialCheckOut || getLocalDateOffset(1));
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [amenitiesExpanded, setAmenitiesExpanded] = useState(false);

  const roomsHref = useMemo(() => buildRoomsHref(checkIn, checkOut), [checkIn, checkOut]);
  const shownAmenities = amenitiesExpanded ? propertyAmenities : propertyAmenities.slice(0, 8);

  return (
    <>
      <section className="vh-section">
        <div className="vh-container">
          <FadeIn className="mb-6">
            <StickerTag className="mb-4" label="Property PLP" rotate="rotate-[-2deg]" />
            <h1 className="vh-title text-4xl md:text-6xl">Vibe House Mumbai Central</h1>
            <p className="mt-3 max-w-[760px] text-base text-white/80 md:text-lg">
              Social co-living stay with clean standards, curated evenings, and category-based inventory selection.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="md:col-span-7">
              <div className="overflow-hidden rounded-[12px] border-2 border-white/20">
                <ImageWithFallback
                  alt={propertyGallery[0].alt}
                  className="h-[320px] w-full object-cover md:h-[430px]"
                  src={propertyGallery[0].src}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 md:col-span-5">
              {propertyGallery.slice(1).map((image) => (
                <div key={image.src} className="overflow-hidden rounded-[12px] border-2 border-white/20">
                  <ImageWithFallback alt={image.alt} className="h-[155px] w-full object-cover md:h-[206px]" src={image.src} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="vh-section vh-section-alt">
        <div className="vh-container grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <SectionHeading align="left" title="Property About" />
                <StickerTag bg="#00d1ff" label="Read More" rotate="rotate-[2deg]" text="#0f172a" />
              </div>

              <div className="space-y-4 text-sm leading-7 text-white/85 md:text-base">
                {(aboutExpanded ? propertyOverview : propertyOverview.slice(0, 1)).map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>

              <button
                className="mt-4 text-xs font-bold uppercase tracking-[1px] text-[var(--vh-cyan)] hover:text-white"
                onClick={() => setAboutExpanded((value) => !value)}
                type="button"
              >
                {aboutExpanded ? "Read Less" : "Read More"}
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <p className="mb-2 text-xs font-bold uppercase tracking-[1px] text-white/70">Select Room Dates</p>
              <div className="grid grid-cols-2 gap-3">
                <label>
                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[1px] text-white/70">Check-In</span>
                  <input
                    className="vh-input"
                    min={getLocalDateOffset(0)}
                    onChange={(event) => setCheckIn(event.target.value)}
                    type="date"
                    value={checkIn}
                  />
                </label>
                <label>
                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[1px] text-white/70">Check-Out</span>
                  <input
                    className="vh-input"
                    min={checkIn || getLocalDateOffset(1)}
                    onChange={(event) => setCheckOut(event.target.value)}
                    type="date"
                    value={checkOut}
                  />
                </label>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <StickerTag bg="#FEF08A" label="Starting at 599" rotate="rotate-[2deg]" text="#0f172a" />
                <StickerTag bg="#39ff14" label="Only category inventory shown" rotate="rotate-[-2deg]" text="#0f172a" />
              </div>
              <Button asChild className="mt-4 w-full">
                <Link href={roomsHref}>Check Availability</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="vh-section">
        <div className="vh-container">
          <div className="mb-6 flex items-end justify-between gap-4">
            <SectionHeading align="left" subtitle="icons and labels" title="Amenities" />
            <button
              className="text-xs font-bold uppercase tracking-[1px] text-[var(--vh-cyan)] hover:text-white"
              onClick={() => setAmenitiesExpanded((value) => !value)}
              type="button"
            >
              {amenitiesExpanded ? "Show Less" : "Show More"}
            </button>
          </div>

          <Stagger className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {shownAmenities.map((amenity) => {
              const Icon = amenityIcons[amenity.icon as keyof typeof amenityIcons] ?? Sparkles;

              return (
                <StaggerItem key={amenity.label}>
                  <Card className="h-full border-white/20 bg-white/5">
                    <CardContent className="flex flex-col items-center gap-3 p-4 text-center">
                      <Icon className="h-5 w-5 text-[var(--vh-cyan)]" />
                      <p className="text-xs font-bold uppercase tracking-[0.08em] text-white/85">{amenity.label}</p>
                    </CardContent>
                  </Card>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      </section>

      <section className="vh-section vh-section-alt" id="select-room">
        <div className="vh-container">
          <div className="mb-5 flex items-center justify-between">
            <SectionHeading align="left" subtitle="category-level selection" title="Room Listing" />
            <StickerTag bg="#FF2E62" className="border-white/20" label="No bed-level selection" rotate="rotate-[2deg]" text="#ffffff" />
          </div>

          <Stagger className="space-y-4">
            {roomCategories.map((room, index) => (
              <StaggerItem key={room.slug}>
                <Card className="overflow-hidden border-white/25 bg-[#1b202f]">
                  <CardContent className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-12">
                      <div className="md:col-span-4">
                        <ImageWithFallback alt={room.title} className="h-[240px] w-full object-cover" src={room.image} />
                      </div>

                      <div className="space-y-4 p-5 md:col-span-6 md:p-6">
                        <div className="flex items-center gap-2">
                          <StickerTag
                            bg={index === 0 ? "#FEF08A" : index === 1 ? "#39ff14" : "#00d1ff"}
                            className="rounded-[3px] border-2 border-[var(--vh-surface-2)] px-3 py-1 text-[10px] font-bold not-italic uppercase"
                            label={room.shortTitle}
                            rotate={index % 2 === 0 ? "rotate-[1deg]" : "rotate-[-1deg]"}
                            text="#0f172a"
                          />
                          <span className="text-xs uppercase tracking-[1px] text-white/60">{room.guestText}</span>
                        </div>

                        <h3 className="text-2xl font-bold uppercase text-white">{room.title}</h3>

                        <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-white/75">
                          {room.features.map((feature) => (
                            <li key={feature}>• {feature}</li>
                          ))}
                        </ul>

                        <p className="text-xs font-bold uppercase tracking-[1px] text-[var(--vh-amber)]">
                          {room.inventoryText}
                        </p>
                      </div>

                      <div className="flex flex-col justify-between border-t border-white/10 p-5 md:col-span-2 md:border-l md:border-t-0 md:p-6">
                        <div>
                          <p className="text-xs uppercase text-white/60">Price for 1 night</p>
                          <p className="text-3xl font-bold text-[var(--vh-pink)]">₹{room.basePrice}</p>
                        </div>
                        <Button asChild className="mt-4 w-full">
                          <Link href={`${roomsHref}#select-room`}>Check Dates</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>

          <div className="mt-6 flex flex-wrap gap-2">
            {roomListingLegend.map((label) => (
              <StickerTag
                key={label}
                bg="#1e293b"
                className="rounded-[3px] border border-[#64748b] px-3 py-1 text-[10px] font-bold not-italic uppercase"
                label={label}
                rotate="rotate-0"
                text="#f1f5f9"
              />
            ))}
          </div>
        </div>
      </section>

      <section className="vh-section">
        <div className="vh-container">
          <SectionHeading subtitle="why guests keep returning" title="Why You’ll Love It Here" />
          <Stagger className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {includedAssurances.map((item, index) => (
              <StaggerItem key={item.label}>
                <Card className="h-full border-white/20 bg-white/5">
                  <CardContent className="p-5 text-center">
                    <div className="mb-3 flex justify-center">
                      <StickerTag
                        bg={item.color}
                        className="rounded-[3px] border-2 border-[var(--vh-surface-2)] px-3 py-1 text-[10px] font-bold not-italic uppercase"
                        label="Included"
                        rotate={index % 2 === 0 ? "rotate-[2deg]" : "rotate-[-2deg]"}
                        text="#0f172a"
                      />
                    </div>
                    <p className="text-sm font-bold uppercase text-white">{item.label}</p>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="vh-section vh-section-alt">
        <div className="vh-container">
          <SectionHeading subtitle="daily activities and chill zones" title="Social Spaces Preview" />
          <Stagger className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {socialSpaces.map((space, index) => (
              <StaggerItem key={space.title}>
                <Card className="overflow-hidden border-white/25 bg-[#1e293b]">
                  <ImageWithFallback alt={space.title} className="h-[180px] w-full object-cover" src={space.image} />
                  <CardContent className="p-5">
                    <StickerTag
                      bg={index === 0 ? "#ff2e62" : index === 1 ? "#00d1ff" : "#39ff14"}
                      className="mb-2 rounded-[3px] border-2 border-[var(--vh-surface-2)] px-3 py-1 text-[10px] font-bold not-italic uppercase"
                      label="Social"
                      rotate={index % 2 === 0 ? "rotate-[2deg]" : "rotate-[-2deg]"}
                      text={index === 0 ? "#ffffff" : "#0f172a"}
                    />
                    <h3 className="text-xl font-bold uppercase text-white">{space.title}</h3>
                    <p className="mt-2 text-sm text-white/75">{space.blurb}</p>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="vh-section">
        <div className="vh-container grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <SectionHeading align="left" subtitle={locationMap.address} title="Location Map" />
            <div className="overflow-hidden rounded-[12px] border-2 border-white/20">
              <iframe
                className="h-[340px] w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={locationMap.embedUrl}
                title={locationMap.title}
              />
            </div>
          </div>

          <div>
            <SectionHeading align="left" subtitle="best spots around property" title="Nearby Attractions" />
            <Card className="border-white/20 bg-white/5">
              <CardContent className="space-y-3 p-5">
                {nearbyAttractions.map((place, index) => (
                  <div key={place.name} className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
                    <div>
                      <p className="font-bold text-white">{place.name}</p>
                      <p className="text-xs uppercase tracking-[1px] text-white/65">{place.type}</p>
                    </div>
                    <StickerTag
                      bg={index % 2 === 0 ? "#00d1ff" : "#fef08a"}
                      className="rounded-[3px] border border-[var(--vh-surface-2)] px-3 py-1 text-[10px] font-bold not-italic uppercase"
                      label={place.travel}
                      rotate="rotate-0"
                      text="#0f172a"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="vh-section vh-section-alt">
        <div className="vh-container grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div>
            <SectionHeading align="left" subtitle="quiet hours and conduct" title="House Rules" />
            <Card className="border-white/20 bg-white/5">
              <CardContent className="space-y-3 p-5 text-sm leading-7 text-white/85">
                {houseRules.map((rule) => (
                  <p key={rule}>• {rule}</p>
                ))}
              </CardContent>
            </Card>
          </div>

          <div>
            <SectionHeading align="left" subtitle="before you confirm" title="Important Information" />
            <Card className="border-white/20 bg-white/5">
              <CardContent className="space-y-3 p-5 text-sm leading-7 text-white/85">
                {importantInfo.map((note) => (
                  <p key={note}>• {note}</p>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="vh-section">
        <div className="vh-container grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div>
            <SectionHeading align="left" title="FAQ" />
            <Card className="border-white/20 bg-white/5 p-4">
              <Accordion collapsible type="single">
                {roomFaqs.map((faq) => (
                  <AccordionItem key={faq.question} value={faq.question}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Card>
          </div>

          <div>
            <SectionHeading align="left" title="Contact" />
            <Card className="border-white/20 bg-white/5 p-6">
              <div className="space-y-5">
                <div>
                  <p className="mb-1 text-xs uppercase tracking-[1px] text-white/60">Phone</p>
                  <a className="text-lg text-[var(--vh-cyan)] hover:text-white" href={siteMeta.contact.phoneHref}>
                    {siteMeta.contact.phoneDisplay}
                  </a>
                </div>
                <div>
                  <p className="mb-1 text-xs uppercase tracking-[1px] text-white/60">Email</p>
                  <a className="text-lg text-[var(--vh-cyan)] hover:text-white" href={siteMeta.contact.emailHref}>
                    {siteMeta.contact.email}
                  </a>
                </div>
                <div>
                  <p className="mb-1 text-xs uppercase tracking-[1px] text-white/60">Address</p>
                  {siteMeta.contact.addressLines.map((line) => (
                    <p key={line} className="text-white/85">{line}</p>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="vh-section vh-section-alt">
        <div className="vh-container">
          <div className="mx-auto max-w-[560px] rounded-[12px] border-4 border-white bg-gradient-to-br from-[var(--vh-pink)] via-[var(--vh-pink-soft)] to-[var(--vh-pink)] p-6 text-center shadow-[10px_10px_0px_0px_rgba(255,255,255,0.2)]">
            <StickerTag bg="#FEF08A" className="mb-3" label="Book Now" rotate="rotate-[-2deg]" text="#0f172a" />
            <h2 className="vh-title">Ready to lock your stay?</h2>
            <p className="mt-3 text-white/90">Pick your dates, choose your room category, and continue to secure checkout.</p>
            <div className="mt-4">
              <BookingWidget
                destinationHref="/rooms"
                initialCheckIn={checkIn}
                initialCheckOut={checkOut}
                submitLabel="Book Now"
                urgencyChips={["Starting at ₹599", "Limited category inventory", "Free cancellation window"]}
                variant="cta"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
