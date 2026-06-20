import { NextResponse } from "next/server";
import { hasAccess } from "@/lib/auth";
import { deleteOption, updateOption } from "@/lib/store";
import { optionUpdateSchema } from "@/lib/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasAccess())) {
    return NextResponse.json({ error: "Passcode required." }, { status: 401 });
  }

  const parsed = optionUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id } = await params;
  const option = await updateOption(id, parsed.data);
  if (!option) {
    return NextResponse.json({ error: "Option not found." }, { status: 404 });
  }

  return NextResponse.json(option);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasAccess())) {
    return NextResponse.json({ error: "Passcode required." }, { status: 401 });
  }

  const { id } = await params;
  const deleted = await deleteOption(id);
  if (!deleted) {
    return NextResponse.json({ error: "Option not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
