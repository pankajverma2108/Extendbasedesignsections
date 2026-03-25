import { Property } from "@/components/marketing/property";
import {
  getDefaultPropertyId,
  getRoomAvailability,
  roomTypesToPropertyCategories,
} from "@/lib/cx-api";

type PropertyPageProps = {
  searchParams?: Promise<{
    checkin?: string;
    checkout?: string;
  }>;
};

export default async function PropertyPage({ searchParams }: PropertyPageProps) {
  const params = await searchParams;
  const propertyId = getDefaultPropertyId();
  const roomTypes = await getRoomAvailability({
    propertyId,
    checkin: params?.checkin,
    checkout: params?.checkout,
  });

  return (
    <Property
      propertyId={propertyId}
      initialCheckIn={params?.checkin}
      initialCheckOut={params?.checkout}
      initialRoomCategories={roomTypesToPropertyCategories(roomTypes)}
    />
  );
}
