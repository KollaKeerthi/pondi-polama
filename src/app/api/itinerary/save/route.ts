import { NextResponse } from "next/server";
import { hasAccess } from "@/lib/auth";
import { generateItineraries } from "@/lib/itinerary";
import { getState, saveItinerary } from "@/lib/store";
import { saveItinerarySchema } from "@/lib/validation";

export async function POST(request: Request) {
  if (!(await hasAccess())) {
    return NextResponse.json({ error: "Passcode required." }, { status: 401 });
  }

  const parsed = saveItinerarySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const state = await getState();
  const itinerary = generateItineraries(state.options, state.ratings, state.travelers).find(
    (candidate) => candidate.id === parsed.data.itineraryId
  );

  if (!itinerary) {
    return NextResponse.json({ error: "Itinerary candidate not found." }, { status: 404 });
  }

  return NextResponse.json(await saveItinerary(itinerary));
}
