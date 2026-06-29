import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcFinancials } from "@/lib/constants";
import { buildTimeEntryData } from "@/lib/timesheet";

const timeEntryInclude = {
  consultant:   { select: { id: true, name: true } },
  deliverables: true,
  notes:        { orderBy: { createdAt: "desc" } },
  timeEntries: {
    orderBy: { date: "asc" },
    include: { user: { select: { id: true, name: true, roleCard: { select: { role: true } } } } },
  },
} as const;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const engagement = await prisma.engagement.findUnique({
    where: { id: params.id },
    include: timeEntryInclude,
  });

  if (!engagement) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(engagement);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();
  const {
    agreedFee, jotformCost, referralPct, startDate, dueDate, timeEntries,
    ...rest
  } = body;

  const existing = await prisma.engagement.findUnique({
    where: { id: params.id },
    include: { timeEntries: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const fee    = agreedFee   ?? existing.agreedFee  ?? 0;
  const jfCost = jotformCost ?? existing.jotformCost;
  const refPct = referralPct ?? existing.referralPct;

  // If a timesheet was supplied, rebuild it (with fresh rate snapshots); otherwise
  // recompute against the entries already on the engagement.
  const replacing = timeEntries !== undefined;
  const newEntries = replacing ? await buildTimeEntryData(timeEntries) : [];
  const lines = replacing ? newEntries : existing.timeEntries;

  const { directCost, chargeoutValue, referralFee, grossMargin, netMargin } =
    calcFinancials(fee, lines, jfCost, refPct);

  const updated = await prisma.engagement.update({
    where: { id: params.id },
    data: {
      ...rest,
      ...(agreedFee   !== undefined ? { agreedFee }   : {}),
      ...(jotformCost !== undefined ? { jotformCost } : {}),
      ...(referralPct !== undefined ? { referralPct } : {}),
      ...(startDate   !== undefined ? { startDate: startDate ? new Date(startDate) : null } : {}),
      ...(dueDate     !== undefined ? { dueDate:   dueDate   ? new Date(dueDate)   : null } : {}),
      ...(replacing ? { timeEntries: { deleteMany: {}, create: newEntries } } : {}),
      directCost, chargeoutValue, referralFee, grossMargin, netMargin,
    },
    include: timeEntryInclude,
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  await prisma.engagement.delete({ where: { id: params.id } });
  return NextResponse.json({ deleted: true });
}
