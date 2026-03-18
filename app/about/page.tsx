import Link from "next/link";

import { SectionHeading } from "@/components/marketing/section-heading";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { FadeIn, Stagger, StaggerItem } from "@/components/shared/motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { aboutPillars, aboutStoryBlocks } from "@/content/about";

export default function AboutPage() {
  return (
    <>
      <section className="vh-section">
        <div className="vh-container grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <FadeIn>
            <p className="vh-kicker inline-block bg-[var(--vh-pink)] px-3 py-1 text-white">About Vibe House</p>
            <h1 className="mt-6 text-5xl font-bold uppercase leading-tight md:text-7xl">
              More than
              <br />
              just a bed.
            </h1>
            <p className="mt-6 text-lg italic text-white/80">
              We are building a global community of explorers, digital nomads, and adventure seekers.
            </p>
            <p className="mt-4 text-base leading-7 text-white/90">
              Vibe House started with a simple idea: travel should bring people together. Not just to share a room, but to share experiences, stories, and lasting friendships.
            </p>
            <p className="mt-4 text-base leading-7 text-white/90">
              Today we operate vibrant hostels across India where backpackers, digital nomads, and solo travelers can find their tribe.
            </p>
          </FadeIn>

          <FadeIn className="overflow-hidden rounded-[12px] border-4 border-white shadow-[12px_12px_0px_0px_rgba(255,46,98,0.5)]" delay={0.1}>
            <ImageWithFallback
              alt="Vibe House building"
              className="aspect-[4/3] w-full object-cover"
              src="https://images.unsplash.com/photo-1501566953613-d93d5cb0be93?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200"
            />
          </FadeIn>
        </div>
      </section>

      <section className="vh-section vh-section-alt">
        <div className="vh-container max-w-screen-lg">
          <SectionHeading subtitle="how we got here" title="The Vibe House Story" />
          <Stagger className="space-y-10">
            {aboutStoryBlocks.map((block, index) => (
              <StaggerItem key={block.title}>
                <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
                  <div className={index % 2 === 1 ? "md:order-2" : ""}>
                    <h3 className="text-2xl font-bold uppercase" style={{ color: block.color }}>
                      {block.title}
                    </h3>
                    <p className="mt-4 text-base leading-7 text-white/90">{block.body}</p>
                  </div>
                  <div className={index % 2 === 1 ? "md:order-1" : ""}>
                    <div className="overflow-hidden rounded-[8px] border-4" style={{ borderColor: block.color }}>
                      <ImageWithFallback alt={block.title} className="aspect-video w-full object-cover" src={block.image} />
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="vh-section">
        <div className="vh-container">
          <SectionHeading subtitle="our four pillars" title="What We Stand For" />
          <Stagger className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {aboutPillars.map((pillar, index) => (
              <StaggerItem key={pillar.title}>
                <Card className="p-8 text-center hover:border-white" style={{ transform: `rotate(${index % 2 === 0 ? -1 : 1}deg)` }}>
                  <CardContent className="p-0">
                    <div
                      className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${pillar.color}20`, color: pillar.color }}
                    >
                      <span className="text-xs font-bold uppercase">Vibe</span>
                    </div>
                    <h3 className="text-xl font-bold uppercase text-white">{pillar.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-white/80">{pillar.description}</p>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="vh-section bg-gradient-to-br from-[var(--vh-pink)] via-[var(--vh-pink-soft)] to-[var(--vh-pink)]">
        <div className="vh-container text-center">
          <h2 className="text-5xl font-bold uppercase leading-tight md:text-7xl">
            Ready to Find
            <br />
            Your Vibe?
          </h2>
          <p className="mx-auto mt-6 max-w-[640px] text-lg italic text-white">
            Join thousands of travelers who have made Vibe House their home away from home.
          </p>
          <Button asChild className="mt-10 bg-white text-[var(--vh-pink)] hover:translate-y-[-2px]" size="lg" variant="secondary">
            <Link href="/rooms">Search Availability</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
