import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcFinancials } from "@/lib/constants";
import { buildTimeEntryData } from "@/lib/timesheet";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const q      = searchParams.get("q");

  const engagements = await prisma.engagement.findMany({
    where: {
      ...(status && status !== "ALL" ? { status: status as any } : {}),
      ...(q ? {
        OR: [
          { client:        { contains: q, mode: "insensitive" } },
          { clientNo:      { contains: q, mode: "insensitive" } },
          { service:       { contains: q, mode: "insensitive" } },
          { referralSource:{ contains: q, mode: "insensitive" } },
          { consultant: { name: { contains: q, mode: "insensitive" } } },
        ],
      } : {}),
    },
    include: {
      consultant:   { select: { id: true, name: true } },
      attachments:  { select: { id: true, title: true, category: true } },
      _count:       { select: { notes: true, timeEntries: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(engagements);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();
  const {
    client, clientNo, service, status, details,
    startDate, dueDate, referralSource, referralPct = 0, consultantId,
    agreedFee = 0, jotformCost = 0, timeEntries,
  } = body;

  if (!client || !consultantId) {
    return NextResponse.json({ error: "client and consultantId are required" }, { status: 400 });
  }

  const authorId = (session.user as any)?.id as string | undefined;
  const entries = await buildTimeEntryData(timeEntries);
  const { directCost, chargeoutValue, referralFee, grossMargin, netMargin } =
    calcFinancials(agreedFee, entries, jotformCost, referralPct);

  const engagement = await prisma.engagement.create({
    data: {
      client, clientNo, service, status, details,
      startDate:  startDate  ? new Date(startDate)  : null,
      dueDate:    dueDate    ? new Date(dueDate)    : null,
      referralSource, referralPct,
      consultantId,
      agreedFee, jotformCost,
      directCost, chargeoutValue, referralFee, grossMargin, netMargin,
      timeEntries: { create: entries },
      // Seed the activity log with a creation event (authored by the lead if no session id).
      notes: { create: { content: `created this engagement${status ? ` as ${status}` : ""}`, system: true, authorId: authorId ?? consultantId } },
    },
    include: {
      consultant: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(engagement, { status: 201 });
}
