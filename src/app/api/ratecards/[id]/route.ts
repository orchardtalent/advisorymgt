import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();
  const { role, hourlyCost, chargeRate, sortOrder, active } = body;

  try {
    const updated = await prisma.rateCard.update({
      where: { id: params.id },
      data: {
        ...(role        !== undefined ? { role: String(role).trim() } : {}),
        ...(hourlyCost  !== undefined ? { hourlyCost: Number(hourlyCost) || 0 } : {}),
        ...(chargeRate  !== undefined ? { chargeRate: Number(chargeRate) || 0 } : {}),
        ...(sortOrder   !== undefined ? { sortOrder: Number(sortOrder) || 0 } : {}),
        ...(active      !== undefined ? { active: Boolean(active) } : {}),
      },
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "A rate card with that role already exists" }, { status: 409 });
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

  // Block deletion while consultants still reference this role — deactivate instead.
  const inUse = await prisma.user.count({ where: { roleId: params.id } });
  if (inUse > 0) {
    return NextResponse.json(
      { error: `In use by ${inUse} consultant${inUse === 1 ? "" : "s"} — reassign them or set it inactive instead` },
      { status: 409 }
    );
  }

  await prisma.rateCard.delete({ where: { id: params.id } });
  return NextResponse.json({ deleted: true });
}
