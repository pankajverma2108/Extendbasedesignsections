import { NextResponse } from "next/server";

import { getDefaultPropertyId, getRoomAvailability, roomTypesToPropertyCategories } from "@/lib/cx-api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("property_id") || getDefaultPropertyId();
  const checkin = searchParams.get("checkin") || undefined;
  const checkout = searchParams.get("checkout") || undefined;

  const roomTypes = await getRoomAvailability({
    propertyId,
    checkin,
    checkout,
  });

  const categories = roomTypesToPropertyCategories(roomTypes);

  return NextResponse.json({
    property_id: propertyId,
    checkin,
    checkout,
    room_types: roomTypes,
    categories,
  });
}
