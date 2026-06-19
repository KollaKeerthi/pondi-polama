import { NextResponse } from "next/server";
import { hasAccess } from "@/lib/auth";
import { addOption } from "@/lib/store";
import { optionSchema } from "@/lib/validation";

export async function POST(request: Request) {
  if (!(await hasAccess())) {
    return NextResponse.json({ error: "Passcode required." }, { status: 401 });
  }

  const parsed = optionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const option = await addOption({
    ...parsed.data,
    totalCost: parsed.data.totalCost ?? null,
    perPersonCost: parsed.data.perPersonCost ?? null
  });

  return NextResponse.json(option, { status: 201 });
}
