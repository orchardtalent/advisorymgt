// Orchard Talent Group — engagement economics

// Seed values for the editable rate card (June 2026). Once seeded, the live
// figures live in the RateCard table and are managed in the app.
export const DEFAULT_RATE_CARDS = [
  { role: "Partner",                       hourlyCost: 307.02, chargeRate: 700.0, sortOrder: 1 },
  { role: "Associate Partner",             hourlyCost: 181.87, chargeRate: 440.0, sortOrder: 2 },
  { role: "Principal",                     hourlyCost: 140.94, chargeRate: 290.0, sortOrder: 3 },
  { role: "Associate Director",            hourlyCost: 146.78, chargeRate: 350.0, sortOrder: 4 },
  { role: "Recruitment Manager",           hourlyCost: 140.94, chargeRate: 290.0, sortOrder: 5 },
  { role: "Senior Recruitment Consultant", hourlyCost: 129.24, chargeRate: 210.0, sortOrder: 6 },
  { role: "Recruitment Consultant",        hourlyCost: 123.39, chargeRate: 160.0, sortOrder: 7 },
  { role: "Admin",                         hourlyCost: 123.39, chargeRate: 160.0, sortOrder: 8 },
] as const;

export const JOTFORM_PER_ENGAGEMENT = 17;
export const JOTFORM_ANNUAL = 408;

export const SERVICES = [
  "Executive Search",
  "Success Profile",
  "Board Performance Review — Light",
  "Board Performance Review — Standard",
  "Board Performance Review — Comprehensive",
  "Board Skills Matrix",
  "Remuneration Benchmarking — Tier 1",
  "Remuneration Benchmarking — Tier 2",
  "Other",
] as const;

export const STATUS_LABELS: Record<string, string> = {
  ENQUIRY:   "Enquiry",
  ACTIVE:    "Active",
  COMPLETED: "Completed",
  ON_HOLD:   "On hold",
  DECLINED:  "Declined",
};

export const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  ENQUIRY:   { bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6" },
  ACTIVE:    { bg: "#F0FDF4", text: "#15803D", dot: "#22C55E" },
  COMPLETED: { bg: "#F5F3FF", text: "#6D28D9", dot: "#8B5CF6" },
  ON_HOLD:   { bg: "#FFFBEB", text: "#B45309", dot: "#F59E0B" },
  DECLINED:  { bg: "#FEF2F2", text: "#B91C1C", dot: "#EF4444" },
};

// A timesheet line as far as the maths is concerned. costRate / chargeRate are
// the rates snapshotted onto the entry when it was logged.
export type FinancialLine = { hours: number; costRate: number; chargeRate: number };

export function calcFinancials(
  agreedFee: number,
  lines: FinancialLine[],
  jotformCost: number,
  referralPct: number = 0
) {
  const labourCost     = lines.reduce((s, l) => s + l.hours * l.costRate,   0);
  const directCost     = labourCost + jotformCost;
  const chargeoutValue = lines.reduce((s, l) => s + l.hours * l.chargeRate, 0);
  const totalHours     = lines.reduce((s, l) => s + l.hours,                0);

  // Referral fee is a percentage of the agreed fee (the revenue billed to the client).
  const referralFee = agreedFee > 0 ? (agreedFee * referralPct) / 100 : 0;

  // Gross margin = cost of delivery vs revenue (the practice view).
  const grossMargin = agreedFee > 0
    ? ((agreedFee - directCost) / agreedFee) * 100
    : null;

  // Net margin also nets off the referral fee paid out (the firm view).
  const netMargin = agreedFee > 0
    ? ((agreedFee - directCost - referralFee) / agreedFee) * 100
    : null;

  return { labourCost, directCost, chargeoutValue, totalHours, referralFee, grossMargin, netMargin };
}

export function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function fmtPct(n: number | null) {
  return n !== null ? `${n.toFixed(1)}%` : "—";
}
