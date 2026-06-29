import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Shell from "@/components/Shell";
import StatusBadge from "@/components/StatusBadge";
import PeriodFilter from "@/components/PeriodFilter";
import { fmtCurrency, fmtPct } from "@/lib/constants";
import { resolvePeriod, periodWhere } from "@/lib/period";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { period?: string; from?: string; to?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const period = resolvePeriod(searchParams.period, searchParams.from, searchParams.to);
  const where  = periodWhere(period);
  const reportQs = new URLSearchParams({
    period: period.key,
    ...(searchParams.from ? { from: searchParams.from } : {}),
    ...(searchParams.to ? { to: searchParams.to } : {}),
  }).toString();

  const engagements = await prisma.engagement.findMany({
    where,
    include: { consultant: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const totalFee      = engagements.reduce((s, e) => s + (e.agreedFee   ?? 0), 0);
  const totalCost     = engagements.reduce((s, e) => s + (e.directCost  ?? 0), 0);
  const totalReferral = engagements.reduce((s, e) => s + (e.referralFee ?? 0), 0);
  const active    = engagements.filter(e => e.status === "ACTIVE").length;
  const completed = engagements.filter(e => e.status === "COMPLETED").length;
  const blendedGross = totalFee > 0 ? ((totalFee - totalCost) / totalFee) * 100 : null;
  const blendedNet   = totalFee > 0 ? ((totalFee - totalCost - totalReferral) / totalFee) * 100 : null;

  const stats = [
    { label: "Engagements",           value: engagements.length },
    { label: "Active",                value: active },
    { label: "Completed",             value: completed },
    { label: "Total fees",            value: fmtCurrency(totalFee) },
    { label: "Gross margin (firm)",     value: fmtPct(blendedGross) },
    { label: "Net margin (practice)", value: fmtPct(blendedNet) },
  ];

  return (
    <Shell>
      <div className="max-w-container mx-auto px-gutter py-7">

        {/* Page header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-black text-heading tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted mt-0.5">Welcome back, {session.user?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/reports/monthly?${reportQs}`} className="otg-btn otg-btn--outline otg-btn--sm">
              Monthly report
            </Link>
            <Link href="/engagements/new" className="otg-btn otg-btn--primary otg-btn--sm">
              + New engagement
            </Link>
          </div>
        </div>

        {/* Period filter */}
        <div className="mb-2">
          <PeriodFilter basePath="/dashboard" current={period.key} from={searchParams.from} to={searchParams.to} />
        </div>
        <p className="text-xs text-muted mb-5">Showing <span className="font-semibold text-heading">{period.label}</span></p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-7">
          {stats.map(s => (
            <div key={s.label} className="otg-card otg-card--flat">
              <p className="text-xs font-semibold text-muted uppercase tracking-eyebrow">{s.label}</p>
              <p className="text-xl font-black text-rich-green mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Engagements in period */}
        <div className="otg-card otg-card--flat p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
            <h2 className="text-sm font-semibold text-heading">Engagements</h2>
            <Link href="/engagements" className="text-xs font-semibold text-link hover:text-link-hover transition-colors duration-fast">
              View all →
            </Link>
          </div>

          {engagements.length === 0 ? (
            <div className="px-5 py-12 text-center text-muted text-sm">
              No engagements in this period.{" "}
              <Link href="/engagements/new" className="text-link font-semibold hover:underline">Add one.</Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-soft-ivory text-xs font-semibold text-muted uppercase tracking-eyebrow border-b border-border-subtle">
                  <th className="text-left px-5 py-3">Client</th>
                  <th className="text-left px-5 py-3">Service</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Consultant</th>
                  <th className="text-right px-5 py-3">Fee</th>
                  <th className="text-right px-5 py-3">Net margin</th>
                </tr>
              </thead>
              <tbody>
                {engagements.slice(0, 10).map(e => (
                  <tr key={e.id} className="border-t border-border-subtle hover:bg-soft-ivory transition-colors duration-fast">
                    <td className="px-5 py-3.5">
                      <Link href={`/engagements/${e.id}`} className="font-semibold text-heading hover:text-link transition-colors duration-fast">
                        {e.client}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-muted">{e.service}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={e.status} /></td>
                    <td className="px-5 py-3.5 text-muted">{e.consultant.name}</td>
                    <td className="px-5 py-3.5 text-right font-semibold tabular-nums text-heading">
                      {e.agreedFee ? fmtCurrency(e.agreedFee) : "—"}
                    </td>
                    <td className={`px-5 py-3.5 text-right font-semibold tabular-nums ${
                      e.netMargin !== null && e.netMargin < 30 ? "text-warm-terracotta" : "text-rich-green"
                    }`}>
                      {fmtPct(e.netMargin)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Shell>
  );
}
