import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readFile, deleteFile } from "@/lib/storage";

// Download a file (auth-gated stream from the volume).
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const att = await prisma.attachment.findUnique({ where: { id: params.id } });
  if (!att) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const bytes = await readFile(att.storageKey);
    const disposition = req.nextUrl.searchParams.get("dl") === "1" ? "attachment" : "inline";
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": att.mimeType,
        "Content-Length": String(att.size),
        "Content-Disposition": `${disposition}; filename="${encodeURIComponent(att.fileName)}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "File missing from storage" }, { status: 410 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const att = await prisma.attachment.findUnique({ where: { id: params.id } });
  if (!att) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await deleteFile(att.storageKey).catch(() => {});
  await prisma.attachment.delete({ where: { id: params.id } });
  return NextResponse.json({ deleted: true });
}
