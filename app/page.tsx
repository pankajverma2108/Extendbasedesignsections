import { HeroCarousel } from "@/components/marketing/widgets/hero-carousel";
import { HomeSections } from "@/components/marketing/pages/home-sections";
import { BookingWidget } from "@/components/marketing/widgets/booking-widget";
import { heroImages, homePageContent } from "@/content/home";
import { getDefaultPropertyId, getPublicEvents, getRoomAvailability, roomTypesToHomeCards } from "@/lib/cx-api";

type HomePageProps = {
  searchParams?: Promise<{
    property_id?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const propertyId = params?.property_id || getDefaultPropertyId() || undefined;
  const propertyDestinationHref = propertyId
    ? `/property?property_id=${encodeURIComponent(propertyId)}`
    : "/property";
  let roomTypes = await getRoomAvailability({ propertyId });
  const usedFallbackRooms = roomTypes.every((room) => room.id.startsWith("fallback-"));

  if (propertyId && usedFallbackRooms) {
    roomTypes = await getRoomAvailability();
  }

  const dynamicHomeRooms = roomTypesToHomeCards(roomTypes);
  const dynamicHomeEvents = await getPublicEvents({ propertyId, limit: 3 });

  return (
    <>
      <section className="relative min-h-[85vh] overflow-hidden">
        <HeroCarousel images={heroImages} titleParts={homePageContent.heroTitle} />
        <div className="absolute inset-x-0 bottom-8 z-10 flex justify-center px-4">
          <div className="w-full max-w-[560px]">
            <BookingWidget
              destinationHref={propertyDestinationHref}
              submitLabel="Book Now"
              variant="hero"
            />
          </div>
        </div>
      </section>

      <HomeSections
        homeEvents={dynamicHomeEvents}
        homeRooms={dynamicHomeRooms}
        propertyDestinationHref={propertyDestinationHref}
      />
    </>
  );
}
