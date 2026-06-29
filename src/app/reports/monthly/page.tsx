import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fmtCurrency, fmtPct } from "@/lib/constants";
import { resolvePeriod, periodWhere } from "@/lib/period";
import PeriodFilter from "@/components/PeriodFilter";
import PrintButton from "@/components/PrintButton";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MonthlySummaryPage({
  searchParams,
}: {
  searchParams: { period?: string; from?: string; to?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Defaults to the current month when opened without a period.
  const period = resolvePeriod(searchParams.period ?? "this-month", searchParams.from, searchParams.to);
  const where  = periodWhere(period);

  const engagements = await prisma.engagement.findMany({
    where,
    include: { consultant: { select: { name: true } } },
    orderBy: [{ client: "asc" }],
  });

  const totalCost = engagements.reduce((s, e) => s + (e.directCost  ?? 0), 0);
  const totalFee  = engagements.reduce((s, e) => s + (e.agreedFee   ?? 0), 0);
  const totalRef  = engagements.reduce((s, e) => s + (e.referralFee ?? 0), 0);
  const blendedGross = totalFee > 0 ? ((totalFee - totalCost) / totalFee) * 100 : null;
  const blendedNet   = totalFee > 0 ? ((totalFee - totalCost - totalRef) / totalFee) * 100 : null;

  const auDate = (d: Date) => d.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-bg print:bg-white px-4 py-8 print:p-0">
      <div className="w-[210mm] max-w-full print:w-full mx-auto">

        {/* Toolbar — hidden on print */}
        <div className="flex items-center justify-between mb-4 print:hidden">
          <Link href="/dashboard" className="text-sm text-muted hover:text-link">← Back to dashboard</Link>
          <PrintButton />
        </div>
        <div className="mb-6 print:hidden">
          <PeriodFilter basePath="/reports/monthly" current={period.key} from={searchParams.from} to={searchParams.to} />
        </div>

        {/* Document — A4 portrait sheet (1cm margins applied via @page on print) */}
        <div className="bg-white rounded-lg border border-border-subtle shadow-sm print:shadow-none print:border-0 print:rounded-none p-[1cm] print:p-0">

          {/* Header */}
          <div className="flex items-start justify-between border-b border-border-strong pb-5 mb-6">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/otg-logo-icon.svg" alt="" className="h-10 w-auto" />
              <div>
                <p className="font-black text-heading text-lg tracking-tight leading-none">Orchard Advisory</p>
                <p className="text-xs text-muted mt-1">Orchard Talent Group</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-muted uppercase tracking-eyebrow">Monthly summary</p>
              <p className="text-xs text-muted mt-1">Generated {auDate(new Date())}</p>
            </div>
          </div>

          <h1 className="text-2xl font-black text-heading tracking-tight">Engagement summary</h1>
          <p className="text-sm text-muted mt-1 mb-6">{period.label}</p>

          {engagements.length === 0 ? (
            <p className="text-sm text-muted">No engagements in this period.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-soft-ivory text-xs font-semibold text-muted uppercase tracking-eyebrow">
                  <th className="text-left px-3 py-2">Client</th>
                  <th className="text-left px-3 py-2">Engagement type</th>
                  <th className="text-right px-3 py-2">Delivery cost</th>
                  <th className="text-right px-3 py-2">Revenue</th>
                  <th className="text-right px-3 py-2">Gross</th>
                  <th className="text-right px-3 py-2">Net</th>
                </tr>
              </thead>
              <tbody>
                {engagements.map(e => (
                  <tr key={e.id} className="border-b border-border-subtle">
                    <td className="px-3 py-2 font-semibold text-heading">{e.client}</td>
                    <td className="px-3 py-2 text-muted">{e.service}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmtCurrency(e.directCost ?? 0)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{e.agreedFee ? fmtCurrency(e.agreedFee) : "—"}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted">{fmtPct(e.grossMargin)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmtPct(e.netMargin)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border-strong font-semibold text-heading">
                  <td className="px-3 py-2" colSpan={2}>Total ({engagements.length})</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtCurrency(totalCost)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtCurrency(totalFee)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-muted">{fmtPct(blendedGross)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtPct(blendedNet)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
