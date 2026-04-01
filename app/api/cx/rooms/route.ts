import { NextResponse } from "next/server";

import { getDefaultPropertyId, getRoomAvailabilitySnapshot, roomTypesToPropertyCategories } from "@/lib/cx-api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const configuredPropertyId = getDefaultPropertyId();
  const propertyId = searchParams.get("property_id") || configuredPropertyId || undefined;
  const checkin = searchParams.get("checkin") || undefined;
  const checkout = searchParams.get("checkout") || undefined;

  const snapshot = await getRoomAvailabilitySnapshot({
    propertyId,
    checkin,
    checkout,
  });

  const categories = roomTypesToPropertyCategories(snapshot.roomTypes);

  return NextResponse.json({
    property_id: snapshot.propertyId || propertyId || configuredPropertyId,
    checkin: snapshot.checkin || checkin,
    checkout: snapshot.checkout || checkout,
    room_types: snapshot.roomTypes,
    categories,
  });
}
