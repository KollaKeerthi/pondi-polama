import { NextResponse } from "next/server";
import { hasAccess } from "@/lib/auth";
import { updateTraveler } from "@/lib/store";
import { travelerUpdateSchema } from "@/lib/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasAccess())) {
    return NextResponse.json({ error: "Passcode required." }, { status: 401 });
  }

  const parsed = travelerUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id } = await params;
  const traveler = await updateTraveler(id, parsed.data);
  if (!traveler) {
    return NextResponse.json({ error: "Traveler not found." }, { status: 404 });
  }

  return NextResponse.json(traveler);
}
