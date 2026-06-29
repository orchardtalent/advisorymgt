import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const rateCards = await prisma.rateCard.findMany({
    orderBy: [{ active: "desc" }, { sortOrder: "asc" }, { role: "asc" }],
    include: { _count: { select: { consultants: true } } },
  });
  return NextResponse.json(rateCards);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();
  const { role, hourlyCost, chargeRate, sortOrder = 0, active = true } = body;

  if (!role?.trim()) {
    return NextResponse.json({ error: "Role name is required" }, { status: 400 });
  }

  try {
    const created = await prisma.rateCard.create({
      data: {
        role: role.trim(),
        hourlyCost: Number(hourlyCost) || 0,
        chargeRate: Number(chargeRate) || 0,
        sortOrder: Number(sortOrder) || 0,
        active: Boolean(active),
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "A rate card with that role already exists" }, { status: 409 });
    }
    throw e;
  }
}
