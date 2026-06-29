import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fmtCurrency, fmtPct } from "@/lib/constants";
import PrintButton from "@/components/PrintButton";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EngagementReportPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const engagement = await prisma.engagement.findUnique({
    where: { id: params.id },
    include: {
      consultant: { select: { name: true } },
      timeEntries: { include: { user: { select: { name: true, roleCard: { select: { role: true } } } } } },
    },
  });
  if (!engagement) notFound();

  // Cost by resource type (role)
  const byRole = new Map<string, { hours: number; cost: number; charge: number }>();
  for (const t of engagement.timeEntries) {
    const role = t.user.roleCard?.role ?? "Unassigned";
    const cur = byRole.get(role) ?? { hours: 0, cost: 0, charge: 0 };
    cur.hours  += t.hours;
    cur.cost   += t.hours * t.costRate;
    cur.charge += t.hours * t.chargeRate;
    byRole.set(role, cur);
  }
  const rows = Array.from(byRole.entries()).map(([role, v]) => ({ role, ...v }));
  const totalHours  = rows.reduce((s, r) => s + r.hours, 0);
  const labourCost  = rows.reduce((s, r) => s + r.cost, 0);
  const chargeout   = rows.reduce((s, r) => s + r.charge, 0);

  const fee = engagement.agreedFee ?? 0;
  const auDate = (d: Date | string) => new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-bg print:bg-white px-4 py-8 print:p-0">
      <div className="w-[210mm] max-w-full print:w-full mx-auto">

        {/* Toolbar — hidden on print */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link href={`/engagements/${engagement.id}`} className="text-sm text-muted hover:text-link">← Back to engagement</Link>
          <PrintButton />
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
              <p className="text-xs font-semibold text-muted uppercase tracking-eyebrow">Engagement report</p>
              <p className="text-xs text-muted mt-1">Generated {auDate(new Date())}</p>
            </div>
          </div>

          {/* Engagement summary */}
          <h1 className="text-2xl font-black text-heading tracking-tight">{engagement.client}</h1>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 mt-4 text-sm">
            <div className="flex justify-between border-b border-border-subtle py-1.5"><span className="text-muted">Service</span><span className="font-semibold text-heading">{engagement.service}</span></div>
            <div className="flex justify-between border-b border-border-subtle py-1.5"><span className="text-muted">Status</span><span className="font-semibold text-heading">{engagement.status}</span></div>
            <div className="flex justify-between border-b border-border-subtle py-1.5"><span className="text-muted">Client number</span><span className="font-semibold text-heading">{engagement.clientNo || "—"}</span></div>
            <div className="flex justify-between border-b border-border-subtle py-1.5"><span className="text-muted">Lead consultant</span><span className="font-semibold text-heading">{engagement.consultant.name}</span></div>
            <div className="flex justify-between border-b border-border-subtle py-1.5"><span className="text-muted">Start date</span><span className="font-semibold text-heading">{engagement.startDate ? auDate(engagement.startDate) : "—"}</span></div>
            <div className="flex justify-between border-b border-border-subtle py-1.5"><span className="text-muted">Due date</span><span className="font-semibold text-heading">{engagement.dueDate ? auDate(engagement.dueDate) : "—"}</span></div>
          </div>

          {/* Cost by resource type */}
          <h2 className="text-xs font-semibold text-muted uppercase tracking-eyebrow mt-8 mb-3">Cost by resource type</h2>
          {rows.length === 0 ? (
            <p className="text-sm text-muted">No time recorded against this engagement.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-soft-ivory text-xs font-semibold text-muted uppercase tracking-eyebrow">
                  <th className="text-left px-3 py-2">Resource type</th>
                  <th className="text-right px-3 py-2">Hours</th>
                  <th className="text-right px-3 py-2">Delivery cost</th>
                  <th className="text-right px-3 py-2">Charge-out</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.role} className="border-b border-border-subtle">
                    <td className="px-3 py-2 font-semibold text-heading">{r.role}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.hours.toFixed(1)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmtCurrency(r.cost)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted">{fmtCurrency(r.charge)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border-strong font-semibold text-heading">
                  <td className="px-3 py-2">Total</td>
                  <td className="px-3 py-2 text-right tabular-nums">{totalHours.toFixed(1)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtCurrency(labourCost)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtCurrency(chargeout)}</td>
                </tr>
              </tfoot>
            </table>
          )}

          {/* Financial summary */}
          <h2 className="text-xs font-semibold text-muted uppercase tracking-eyebrow mt-8 mb-3">Financial summary</h2>
          <div className="text-sm">
            <div className="flex justify-between border-b border-border-subtle py-2"><span className="text-muted">Revenue (agreed fee, excl. GST)</span><span className="font-semibold tabular-nums text-heading">{fee ? fmtCurrency(fee) : "—"}</span></div>
            <div className="flex justify-between border-b border-border-subtle py-2"><span className="text-muted">Delivery cost (labour)</span><span className="font-semibold tabular-nums text-heading">{fmtCurrency(labourCost)}</span></div>
            {engagement.jotformCost > 0 && (
              <div className="flex justify-between border-b border-border-subtle py-2"><span className="text-muted">JotForm</span><span className="font-semibold tabular-nums text-heading">{fmtCurrency(engagement.jotformCost)}</span></div>
            )}
            <div className="flex justify-between border-b border-border-subtle py-2"><span className="text-muted">Total direct cost</span><span className="font-semibold tabular-nums text-heading">{fmtCurrency(engagement.directCost ?? 0)}</span></div>
            <div className="flex justify-between border-b border-border-subtle py-2"><span className="text-muted">Charge-out value</span><span className="font-semibold tabular-nums text-heading">{fmtCurrency(chargeout)}</span></div>
            {engagement.referralPct > 0 && (
              <div className="flex justify-between border-b border-border-subtle py-2">
                <span className="text-muted">Referral fee ({engagement.referralPct}%{engagement.referralSource ? ` · ${engagement.referralSource}` : ""})</span>
                <span className="font-semibold tabular-nums text-warm-terracotta">−{fmtCurrency(engagement.referralFee ?? 0)}</span>
              </div>
            )}
            <div className="flex justify-between py-2.5 mt-1"><span className="font-semibold text-heading">Gross margin <span className="text-muted font-normal text-xs">firm</span></span><span className="font-black text-lg tabular-nums text-rich-green">{fmtPct(engagement.grossMargin)}</span></div>
            <div className="flex justify-between py-1"><span className="font-semibold text-heading">Net margin <span className="text-muted font-normal text-xs">practice</span></span><span className="font-black text-lg tabular-nums text-rich-green">{fmtPct(engagement.netMargin)}</span></div>
          </div>

        </div>
      </div>
    </div>
  );
}
