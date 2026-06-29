import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Shell from "@/components/Shell";
import StatusBadge from "@/components/StatusBadge";
import NotesManager from "@/components/NotesManager";
import FilesManager from "@/components/FilesManager";
import { fmtCurrency, fmtPct } from "@/lib/constants";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EngagementDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const engagement = await prisma.engagement.findUnique({
    where: { id: params.id },
    include: {
      consultant:   { select: { id: true, name: true } },
      attachments:  { orderBy: { createdAt: "desc" }, include: { uploadedBy: { select: { name: true } } } },
      notes:        { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } },
      timeEntries: {
        orderBy: { date: "asc" },
        include: { user: { select: { name: true, roleCard: { select: { role: true } } } } },
      },
    },
  });
  if (!engagement) notFound();

  const totalHrs   = engagement.timeEntries.reduce((s, t) => s + t.hours, 0);
  const chargeout  = engagement.chargeoutValue ?? engagement.timeEntries.reduce((s, t) => s + t.hours * t.chargeRate, 0);
  const labourCost = engagement.timeEntries.reduce((s, t) => s + t.hours * t.costRate, 0);

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex justify-between items-start py-2.5 border-b border-border-subtle last:border-0 text-sm">
      <span className="text-muted min-w-[170px]">{label}</span>
      <span className="font-semibold text-right text-heading">{value ?? "—"}</span>
    </div>
  );

  const sectionHead = "text-xs font-semibold text-muted uppercase tracking-eyebrow mb-3";
  const auDate = (d: Date | string) => new Date(d).toLocaleDateString("en-AU");

  return (
    <Shell>
      <div className="max-w-container mx-auto px-gutter py-7">

        {/* Header */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <Link href="/engagements" className="text-xs text-muted hover:text-link mb-2 inline-block transition-colors duration-fast">
              ← Engagements
            </Link>
            <h1 className="text-2xl font-black text-heading tracking-tight">{engagement.client}</h1>
            <div className="flex items-center gap-3 mt-2">
              <StatusBadge status={engagement.status} />
              <span className="text-sm text-muted">{engagement.service}</span>
              {engagement.clientNo && <span className="text-sm text-muted">· Client #{engagement.clientNo}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/engagements/${engagement.id}/report`} className="otg-btn otg-btn--ghost otg-btn--sm">
              Report
            </Link>
            <Link href={`/engagements/${engagement.id}/edit`} className="otg-btn otg-btn--outline otg-btn--sm">
              Edit
            </Link>
          </div>
        </div>

        {/* Row 1 — key facts side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5 items-start">
          <div className="flex flex-col gap-5">
            <div className="otg-card otg-card--ivory">
              <p className={sectionHead}>Engagement</p>
              <Row label="Service"         value={engagement.service} />
              <Row label="Client number"   value={engagement.clientNo} />
              <Row label="Lead consultant" value={engagement.consultant.name} />
              <Row label="Referral source" value={engagement.referralSource} />
              <Row label="Start date"      value={engagement.startDate ? auDate(engagement.startDate) : null} />
              <Row label="Due date"        value={engagement.dueDate   ? auDate(engagement.dueDate)   : null} />
            </div>

            {engagement.details && (
              <div className="otg-card otg-card--ivory">
                <p className={sectionHead}>Scope notes</p>
                <p className="text-sm text-body leading-relaxed whitespace-pre-wrap">{engagement.details}</p>
              </div>
            )}
          </div>

          <div className="otg-card otg-card--ivory">
            <p className={sectionHead}>Financials</p>
            <Row label="Agreed fee (excl. GST)" value={<span className="tabular-nums">{engagement.agreedFee ? fmtCurrency(engagement.agreedFee) : "—"}</span>} />
            <Row label="Direct cost"            value={<span className="tabular-nums">{fmtCurrency(engagement.directCost ?? 0)}</span>} />
            <Row label="Charge-out value"       value={<span className="tabular-nums">{fmtCurrency(chargeout)}</span>} />
            {engagement.jotformCost > 0 && (
              <Row label="JotForm"              value={<span className="tabular-nums">{fmtCurrency(engagement.jotformCost)}</span>} />
            )}
            {engagement.referralPct > 0 && (
              <Row
                label={`Referral fee (${engagement.referralPct}%${engagement.referralSource ? ` · ${engagement.referralSource}` : ""})`}
                value={<span className="tabular-nums text-warm-terracotta">−{fmtCurrency(engagement.referralFee ?? 0)}</span>}
              />
            )}
            <div className="flex justify-between items-center pt-3 mt-1 border-t border-border-strong">
              <span className="font-semibold text-heading">Gross margin <span className="text-muted font-normal text-xs">firm</span></span>
              <span className={`font-black text-lg tabular-nums ${engagement.grossMargin !== null && engagement.grossMargin < 30 ? "text-warm-terracotta" : "text-rich-green"}`}>
                {fmtPct(engagement.grossMargin)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="font-semibold text-heading">Net margin <span className="text-muted font-normal text-xs">practice</span></span>
              <span className={`font-black text-xl tabular-nums ${engagement.netMargin !== null && engagement.netMargin < 30 ? "text-warm-terracotta" : "text-rich-green"}`}>
                {fmtPct(engagement.netMargin)}
              </span>
            </div>
          </div>
        </div>

        {/* Row 2 — timesheet, full width */}
        <div className="otg-card otg-card--ivory mb-5">
          <p className={sectionHead}>Timesheet</p>
          {engagement.timeEntries.length === 0 ? (
            <p className="text-sm text-muted">No time logged yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-semibold text-muted uppercase tracking-eyebrow border-b border-border-strong">
                  <th className="text-left py-2 pr-3">Consultant</th>
                  <th className="text-left py-2 pr-3">Date</th>
                  <th className="text-right py-2 pr-3">Hrs</th>
                  <th className="text-right py-2 pr-3">Cost</th>
                  <th className="text-right py-2">Charge</th>
                </tr>
              </thead>
              <tbody>
                {engagement.timeEntries.map(t => (
                  <tr key={t.id} className="border-b border-border-subtle last:border-0">
                    <td className="py-2 pr-3">
                      <span className="font-semibold text-heading">{t.user.name}</span>
                      {t.user.roleCard && <span className="block text-xs text-muted">{t.user.roleCard.role}</span>}
                    </td>
                    <td className="py-2 pr-3 text-muted text-xs">{auDate(t.date)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{t.hours}</td>
                    <td className="py-2 pr-3 text-right tabular-nums text-muted">{fmtCurrency(t.hours * t.costRate)}</td>
                    <td className="py-2 text-right tabular-nums text-muted">{fmtCurrency(t.hours * t.chargeRate)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border-strong font-semibold text-heading">
                  <td className="py-2 pr-3" colSpan={2}>Total</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{totalHrs.toFixed(1)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{fmtCurrency(labourCost)}</td>
                  <td className="py-2 text-right tabular-nums">{fmtCurrency(chargeout)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Row 3 — files & deliverables, full width */}
        <FilesManager engagementId={engagement.id} initial={JSON.parse(JSON.stringify(engagement.attachments))} />

        {/* Row 4 — notes & activity, full width */}
        <NotesManager engagementId={engagement.id} initial={JSON.parse(JSON.stringify(engagement.notes))} />
      </div>
    </Shell>
  );
}
