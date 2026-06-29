import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const consultantSelect = {
  id: true,
  name: true,
  email: true,
  active: true,
  canManage: true,
  roleId: true,
  roleCard: { select: { id: true, role: true, hourlyCost: true, chargeRate: true } },
} as const;

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();
  const { name, email, roleId, canManage, active, password } = body;

  const data: Record<string, unknown> = {};
  if (name      !== undefined) data.name = String(name).trim();
  if (email     !== undefined) data.email = String(email).trim().toLowerCase();
  if (roleId    !== undefined) data.roleId = roleId || null;
  if (canManage !== undefined) data.canManage = Boolean(canManage);
  if (active    !== undefined) data.active = Boolean(active);
  if (password?.trim())        data.password = await bcrypt.hash(password, 12);

  try {
    const updated = await prisma.user.update({
      where: { id: params.id },
      data,
      select: consultantSelect,
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "A consultant with that email already exists" }, { status: 409 });
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

  // Consultants are referenced by engagements and time entries, so we deactivate
  // rather than hard-delete to preserve history.
  const updated = await prisma.user.update({
    where: { id: params.id },
    data: { active: false },
    select: { id: true, active: true },
  });
  return NextResponse.json(updated);
}
