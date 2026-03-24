import { HeroCarousel } from "@/components/marketing/hero-carousel";
import { HomeSections } from "@/components/marketing/home-sections";
import { BookingWidget } from "@/components/marketing/booking-widget";
import { heroImages, homePageContent } from "@/content/home";

export default function HomePage() {
  return (
    <>
      <section className="relative min-h-[85vh] overflow-hidden">
        <HeroCarousel images={heroImages} titleParts={homePageContent.heroTitle} />
        <div className="absolute inset-x-0 bottom-12 z-10 flex justify-center px-4">
          <div className="w-full max-w-[640px]">
            <BookingWidget
              destinationHref="/property"
              submitLabel="Book Now"
              variant="hero"
            />
          </div>
        </div>
      </section>

      <HomeSections />
    </>
  );
}
