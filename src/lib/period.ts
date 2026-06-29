// Date-range resolution for the dashboard + reports.
// Australian financial year runs 1 July – 30 June. Quarters are calendar quarters
// (Jan–Mar, Apr–Jun, Jul–Sep, Oct–Dec); the resolved range is always shown in the UI.

export type PeriodKey =
  | "all"
  | "this-month"
  | "last-month"
  | "this-quarter"
  | "last-quarter"
  | "this-fy"
  | "custom";

export const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: "this-month",   label: "This month" },
  { key: "last-month",   label: "Last month" },
  { key: "this-quarter", label: "This quarter" },
  { key: "last-quarter", label: "Last quarter" },
  { key: "this-fy",      label: "Financial year" },
  { key: "all",          label: "All time" },
];

export type ResolvedPeriod = {
  key: PeriodKey;
  gte: Date | null;
  lte: Date | null;
  label: string;
};

const som = (y: number, m: number) => new Date(y, m, 1, 0, 0, 0, 0);
const eom = (y: number, m: number) => new Date(y, m + 1, 0, 23, 59, 59, 999);
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
const endOfDay   = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

const auDate = (d: Date) =>
  d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });

export function resolvePeriod(
  key?: string | null,
  from?: string | null,
  to?: string | null,
  now: Date = new Date()
): ResolvedPeriod {
  const y = now.getFullYear();
  const m = now.getMonth();
  let gte: Date | null = null;
  let lte: Date | null = null;
  let resolved: PeriodKey = (key as PeriodKey) || "all";

  switch (key) {
    case "this-month":
      gte = som(y, m); lte = eom(y, m); break;
    case "last-month": {
      const d = new Date(y, m - 1, 1);
      gte = som(d.getFullYear(), d.getMonth());
      lte = eom(d.getFullYear(), d.getMonth());
      break;
    }
    case "this-quarter": {
      const q = Math.floor(m / 3);
      gte = som(y, q * 3); lte = eom(y, q * 3 + 2); break;
    }
    case "last-quarter": {
      const d = new Date(y, Math.floor(m / 3) * 3 - 3, 1);
      gte = som(d.getFullYear(), d.getMonth());
      lte = eom(d.getFullYear(), d.getMonth() + 2);
      break;
    }
    case "this-fy": {
      const fyStart = m >= 6 ? y : y - 1; // July = month index 6
      gte = som(fyStart, 6); lte = eom(fyStart + 1, 5); break;
    }
    case "custom":
      resolved = "custom";
      if (from) gte = startOfDay(new Date(from));
      if (to)   lte = endOfDay(new Date(to));
      break;
    default:
      resolved = "all";
  }

  let label = "All time";
  if (gte && lte)      label = `${auDate(gte)} – ${auDate(lte)}`;
  else if (gte)        label = `From ${auDate(gte)}`;
  else if (lte)        label = `Up to ${auDate(lte)}`;

  return { key: resolved, gte, lte, label };
}

// Prisma `where` filtering engagements into the period: by startDate, falling back
// to createdAt for engagements that have no start date yet (e.g. enquiries).
export function periodWhere(p: ResolvedPeriod) {
  if (!p.gte && !p.lte) return {};
  const between: { gte?: Date; lte?: Date } = {};
  if (p.gte) between.gte = p.gte;
  if (p.lte) between.lte = p.lte;
  return {
    OR: [
      { startDate: between },
      { AND: [{ startDate: null }, { createdAt: between }] },
    ],
  };
}
