import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const noteInclude = { author: { select: { id: true, name: true } } } as const;

// List the activity log for an engagement (notes + system events), newest first.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const notes = await prisma.note.findMany({
    where: { engagementId: params.id },
    include: noteInclude,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(notes);
}

// Add a typed note authored by the logged-in consultant.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const authorId = (session.user as any)?.id as string | undefined;
  if (!authorId) return NextResponse.json({ error: "No author in session" }, { status: 400 });

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Note content is required" }, { status: 400 });

  const note = await prisma.note.create({
    data: { engagementId: params.id, content: content.trim(), authorId, system: false },
    include: noteInclude,
  });
  return NextResponse.json(note, { status: 201 });
}
