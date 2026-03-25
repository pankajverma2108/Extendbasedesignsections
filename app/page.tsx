import { HeroCarousel } from "@/components/marketing/hero-carousel";
import { HomeSections } from "@/components/marketing/home-sections";
import { BookingWidget } from "@/components/marketing/booking-widget";
import { heroImages, homePageContent } from "@/content/home";
import {
  getDefaultPropertyId,
  getPublicEvents,
  getRoomAvailability,
  roomTypesToHomeCards,
} from "@/lib/cx-api";

export default async function HomePage() {
  const propertyId = getDefaultPropertyId();
  const roomTypes = await getRoomAvailability({ propertyId });
  const dynamicHomeRooms = roomTypesToHomeCards(roomTypes);
  const dynamicHomeEvents = await getPublicEvents({ propertyId, limit: 3 });

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

      <HomeSections homeEvents={dynamicHomeEvents} homeRooms={dynamicHomeRooms} />
    </>
  );
}
