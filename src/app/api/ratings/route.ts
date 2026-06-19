import { NextResponse } from "next/server";
import { hasAccess } from "@/lib/auth";
import { upsertRating } from "@/lib/store";
import { ratingSchema } from "@/lib/validation";

export async function POST(request: Request) {
  if (!(await hasAccess())) {
    return NextResponse.json({ error: "Passcode required." }, { status: 401 });
  }

  const parsed = ratingSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  return NextResponse.json(await upsertRating(parsed.data), { status: 201 });
}
