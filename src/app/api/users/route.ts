import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const consultantSelect = {
  id: true,
  name: true,
  email: true,
  active: true,
  canManage: true,
  roleId: true,
  roleCard: { select: { id: true, role: true, hourlyCost: true, chargeRate: true } },
} as const;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const includeInactive = searchParams.get("all") === "1";

  const users = await prisma.user.findMany({
    where: includeInactive ? {} : { active: true },
    select: consultantSelect,
    orderBy: { name: "asc" },
  });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();
  const { name, email, roleId, canManage = false, active = true, password } = body;

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }

  // A login isn't required for a consultant who only logs time, but the column is
  // non-null — set a random password so the account can't be signed into until reset.
  const raw = password?.trim() ? password : crypto.randomBytes(24).toString("hex");
  const hashed = await bcrypt.hash(raw, 12);

  try {
    const created = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashed,
        roleId: roleId || null,
        canManage: Boolean(canManage),
        active: Boolean(active),
      },
      select: consultantSelect,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "A consultant with that email already exists" }, { status: 409 });
    }
    throw e;
  }
}
