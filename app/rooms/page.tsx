import { BookingWidget } from "@/components/marketing/booking-widget";
import { RoomCard } from "@/components/marketing/room-card";
import { SectionHeading } from "@/components/marketing/section-heading";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { FadeIn, Stagger, StaggerItem } from "@/components/shared/motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { houseRules, includedAssurances, roomFaqs, rooms } from "@/content/rooms";
import { siteMeta } from "@/content/site";

export default function RoomsPage() {
  return (
    <>
      <section className="relative flex min-h-[60vh] items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <ImageWithFallback
            alt="Rooms hero"
            className="h-full w-full object-cover"
            src="https://images.unsplash.com/photo-1694151569569-8288e3118519?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1400"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[rgba(35,15,20,0.75)] to-[var(--vh-bg)]" />
        </div>
        <FadeIn className="relative z-10 vh-container py-16 text-center">
          <p className="vh-kicker inline-block bg-[var(--vh-pink)] px-3 py-1 text-white">Choose Your Vibe</p>
          <h1 className="mt-6 text-5xl font-bold uppercase leading-tight md:text-7xl">
            Find Your Vibe.
            <br />
            Book Your Bed.
          </h1>
          <p className="mx-auto mt-4 max-w-[620px] text-lg italic text-white/80">
            From social dorms to private retreats, we have the right space for every traveler.
          </p>
        </FadeIn>
      </section>

      <section className="vh-section">
        <div className="vh-container">
          <Stagger className="grid grid-cols-1 gap-8 xl:grid-cols-3">
            {rooms.map((room) => (
              <StaggerItem key={room.title}>
                <RoomCard {...room} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="vh-section vh-section-alt">
        <div className="vh-container">
          <SectionHeading subtitle="no hidden fees, just good vibes" title="Included with Every Stay" />
          <Stagger className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {includedAssurances.map((item) => (
              <StaggerItem key={item.label}>
                <Card className="p-6 text-center">
                  <CardContent className="p-0">
                    <p className="text-sm font-bold uppercase" style={{ color: item.color }}>
                      {item.label}
                    </p>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="vh-section">
        <div className="vh-container max-w-screen-md">
          <SectionHeading subtitle="keeping the vibe alive for everyone" title="House Rules" />
          <Card className="p-8">
            <ul className="space-y-4 text-base leading-7 text-white">
              {houseRules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      <section className="vh-section vh-section-alt">
        <div className="vh-container">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <div>
              <SectionHeading align="left" title="Frequently Asked Questions" />
              <Card className="p-5">
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
              <SectionHeading align="left" title="Get in Touch" />
              <Card className="space-y-6 p-6">
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[1px] text-white/60">WhatsApp / Phone</p>
                  <a className="text-lg text-[var(--vh-blue)] hover:text-[var(--vh-pink)]" href={siteMeta.contact.phoneHref}>
                    {siteMeta.contact.phoneDisplay}
                  </a>
                </div>
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[1px] text-white/60">Email</p>
                  <a className="text-lg text-[var(--vh-blue)] hover:text-[var(--vh-pink)]" href={siteMeta.contact.emailHref}>
                    {siteMeta.contact.email}
                  </a>
                </div>
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[1px] text-white/60">Address</p>
                  {siteMeta.contact.addressLines.map((line) => (
                    <p key={line} className="text-base text-white">
                      {line}
                    </p>
                  ))}
                </div>
                <BookingWidget destinationHref="/rooms" submitLabel="Check Dates" variant="inline" />
              </Card>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
