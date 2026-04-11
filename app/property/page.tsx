import { ColiveFlow } from "@/components/colive/colive-flow";
import { Property } from "@/components/marketing/property";
import {
  getDefaultPropertyId,
  getRoomAvailabilitySnapshot,
  roomTypesToPropertyCategories,
} from "@/lib/cx-api";

type PropertyPageProps = {
  searchParams?: Promise<{
    checkin?: string;
    checkout?: string;
    property_id?: string;
    type?: string;
    location?: string;
  }>;
};

export default async function PropertyPage({ searchParams }: PropertyPageProps) {
  const params = await searchParams;
  if (params?.type === "colive") {
    return <ColiveFlow initialLocation={params.location} />;
  }

  const requestedPropertyId = params?.property_id || getDefaultPropertyId() || undefined;
  const snapshot = await getRoomAvailabilitySnapshot({
    propertyId: requestedPropertyId,
    checkin: params?.checkin,
    checkout: params?.checkout,
  });
  const backendPropertyId = snapshot.propertyId || requestedPropertyId;

  return (
    <Property
      propertyId={backendPropertyId}
      initialCheckIn={params?.checkin}
      initialCheckOut={params?.checkout}
      initialRoomCategories={roomTypesToPropertyCategories(snapshot.roomTypes)}
    />
  );
}
