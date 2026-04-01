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
    property_id?: string;
  }>;
};

export default async function PropertyPage({ searchParams }: PropertyPageProps) {
  const params = await searchParams;
  const propertyId = params?.property_id || getDefaultPropertyId() || undefined;
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
