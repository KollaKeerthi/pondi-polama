import { NextResponse } from "next/server";
import { accessToken, cookieOptions } from "@/lib/auth";

export async function POST(request: Request) {
  const { passcode } = (await request.json()) as { passcode?: string };
  const expected = process.env.TRIP_PASSCODE ?? "pondipolama";

  if (!passcode || passcode !== expected) {
    return NextResponse.json({ error: "Invalid passcode." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("pondi-polama-access", accessToken(), cookieOptions());
  return response;
}
