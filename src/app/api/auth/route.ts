import { NextResponse } from "next/server";
import { accessToken, cookieOptions } from "@/lib/auth";
import { createSeedTravelers } from "@/lib/seed";

export async function POST(request: Request) {
  const { passcode, travelerId } = (await request.json()) as { passcode?: string; travelerId?: string };
  const expected = process.env.TRIP_PASSCODE ?? "pondipolama";
  const traveler = createSeedTravelers().find((item) => item.id === travelerId);

  if (!passcode || passcode !== expected || !traveler) {
    return NextResponse.json({ error: "Invalid passcode." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, travelerId: traveler.id });
  response.cookies.set("pondi-polama-access", accessToken(), cookieOptions());
  response.cookies.set("pondi-polama-traveler", traveler.id, cookieOptions());
  return response;
}
