import { prisma } from "@/lib/prisma";

export type IncomingEntry = {
  userId: string;
  date?: string | null;
  hours: number | string;
  note?: string | null;
};

export type TimeEntryData = {
  userId: string;
  date: Date;
  hours: number;
  costRate: number;
  chargeRate: number;
  note: string | null;
};

// Turn timesheet rows from the client into TimeEntry create-data, snapshotting
// each consultant's current rate-card rates onto the line (so editing a rate card
// later does not retroactively change billed engagements).
export async function buildTimeEntryData(entries: IncomingEntry[] | undefined): Promise<TimeEntryData[]> {
  const valid = (entries ?? []).filter((e) => e.userId && Number(e.hours) > 0);
  if (valid.length === 0) return [];

  const userIds = Array.from(new Set(valid.map((e) => e.userId)));
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, roleCard: { select: { hourlyCost: true, chargeRate: true } } },
  });
  const rateByUser = new Map(users.map((u) => [u.id, u.roleCard]));

  return valid.map((e) => {
    const rc = rateByUser.get(e.userId);
    return {
      userId: e.userId,
      date: e.date ? new Date(e.date) : new Date(),
      hours: Number(e.hours) || 0,
      costRate: rc?.hourlyCost ?? 0,
      chargeRate: rc?.chargeRate ?? 0,
      note: e.note?.trim() ? e.note.trim() : null,
    };
  });
}
