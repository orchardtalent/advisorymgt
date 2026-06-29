import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();
  const { name, color, sortOrder, active, isDefault } = body;

  const data: Record<string, unknown> = {};
  if (name      !== undefined) data.name = String(name).trim();
  if (color     !== undefined) data.color = String(color);
  if (sortOrder !== undefined) data.sortOrder = Number(sortOrder) || 0;
  if (active    !== undefined) data.active = Boolean(active);
  if (isDefault !== undefined) data.isDefault = Boolean(isDefault);

  try {
    const updated = await prisma.$transaction(async (tx) => {
      if (isDefault === true) await tx.status.updateMany({ data: { isDefault: false } });
      return tx.status.update({ where: { id: params.id }, data });
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e?.code === "P2002") return NextResponse.json({ error: "A status with that name already exists" }, { status: 409 });
    if (e?.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    throw e;
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const st = await prisma.status.findUnique({ where: { id: params.id } });
  if (!st) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // engagement.status is free-text, so deleting only removes the option.
  const inUse = await prisma.engagement.count({ where: { status: st.name } });
  await prisma.status.delete({ where: { id: params.id } });
  return NextResponse.json({ deleted: true, inUse });
}
