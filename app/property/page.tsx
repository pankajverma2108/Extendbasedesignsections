import { ColiveFlow } from "@/components/colive/colive-flow";
import { Property } from "@/components/marketing/property";
import {
  getDefaultPropertyId,
  getRoomCatalogSnapshot,
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
  const hasDateWindow = Boolean(params?.checkin && params?.checkout);
  const snapshot = hasDateWindow
    ? await getRoomAvailabilitySnapshot({
        propertyId: requestedPropertyId,
        checkin: params?.checkin,
        checkout: params?.checkout,
      })
    : await getRoomCatalogSnapshot({
        propertyId: requestedPropertyId,
      });
  const backendPropertyId = snapshot.propertyId || requestedPropertyId;

  return (
    <Property
      propertyId={backendPropertyId}
      initialCheckIn={hasDateWindow ? params?.checkin : undefined}
      initialCheckOut={hasDateWindow ? params?.checkout : undefined}
      initialRoomCategories={roomTypesToPropertyCategories(snapshot.roomTypes)}
    />
  );
}
