import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();
  const { name, sortOrder, active } = body;

  const data: Record<string, unknown> = {};
  if (name      !== undefined) data.name = String(name).trim();
  if (sortOrder !== undefined) data.sortOrder = Number(sortOrder) || 0;
  if (active    !== undefined) data.active = Boolean(active);

  try {
    const updated = await prisma.service.update({ where: { id: params.id }, data });
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "An engagement type with that name already exists" }, { status: 409 });
    }
    if (e?.code === "P2025") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    throw e;
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const svc = await prisma.service.findUnique({ where: { id: params.id } });
  if (!svc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // engagement.service is a free-text snapshot, so deleting only removes the option.
  // Report how many engagements currently use the name, for the UI to surface.
  const inUse = await prisma.engagement.count({ where: { service: svc.name } });
  await prisma.service.delete({ where: { id: params.id } });
  return NextResponse.json({ deleted: true, inUse });
}
