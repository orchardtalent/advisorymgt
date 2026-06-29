import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const includeInactive = searchParams.get("all") === "1";
  const statuses = await prisma.status.findMany({
    where: includeInactive ? {} : { active: true },
    orderBy: [{ active: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(statuses);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();
  const { name, color = "outline", sortOrder = 0, active = true, isDefault = false } = body;
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  try {
    const created = await prisma.$transaction(async (tx) => {
      if (isDefault) await tx.status.updateMany({ data: { isDefault: false } });
      return tx.status.create({
        data: {
          name: name.trim(),
          color: String(color),
          sortOrder: Number(sortOrder) || 0,
          active: Boolean(active),
          isDefault: Boolean(isDefault),
        },
      });
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002") return NextResponse.json({ error: "A status with that name already exists" }, { status: 409 });
    throw e;
  }
}
