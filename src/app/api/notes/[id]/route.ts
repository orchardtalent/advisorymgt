import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Edit a typed note. System log entries (status changes etc.) are read-only.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Note content is required" }, { status: 400 });

  const existing = await prisma.note.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.system) return NextResponse.json({ error: "System log entries can't be edited" }, { status: 403 });

  const note = await prisma.note.update({
    where: { id: params.id },
    data: { content: content.trim() },
    include: { author: { select: { id: true, name: true } } },
  });
  return NextResponse.json(note);
}
