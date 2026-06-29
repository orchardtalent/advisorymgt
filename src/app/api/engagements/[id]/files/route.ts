import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveFile } from "@/lib/storage";
import { FILE_CATEGORIES, MAX_UPLOAD_BYTES } from "@/lib/constants";

const fileInclude = { uploadedBy: { select: { name: true } } } as const;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const files = await prisma.attachment.findMany({
    where: { engagementId: params.id },
    include: fileInclude,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(files);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const uploadedById = (session.user as any)?.id as string | undefined;

  const form = await req.formData();
  const file = form.get("file");
  const category = String(form.get("category") || "");
  const title = String(form.get("title") || "");

  if (!(file instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!FILE_CATEGORIES.includes(category as any)) return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "File exceeds 25 MB limit" }, { status: 413 });
  if (file.size === 0) return NextResponse.json({ error: "File is empty" }, { status: 400 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const storageKey = await saveFile(params.id, file.name, bytes);

  const attachment = await prisma.attachment.create({
    data: {
      engagementId: params.id,
      category,
      title: title.trim() || file.name,
      fileName: file.name,
      storageKey,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      uploadedById,
    },
    include: fileInclude,
  });
  return NextResponse.json(attachment, { status: 201 });
}
