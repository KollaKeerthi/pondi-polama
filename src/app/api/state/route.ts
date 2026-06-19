import { NextResponse } from "next/server";
import { hasAccess } from "@/lib/auth";
import { generateItineraries } from "@/lib/itinerary";
import { rankOptions } from "@/lib/rankings";
import { getState } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await hasAccess())) {
    return NextResponse.json({ error: "Passcode required." }, { status: 401 });
  }

  const state = await getState();

  return NextResponse.json({
    ...state,
    rankedOptions: rankOptions(state.options, state.ratings),
    itineraryCandidates: generateItineraries(state.options, state.ratings, state.travelers)
  });
}
