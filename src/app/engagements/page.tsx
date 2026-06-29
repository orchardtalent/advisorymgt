import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Shell from "@/components/Shell";
import StatusBadge from "@/components/StatusBadge";
import { fmtCurrency, fmtPct } from "@/lib/constants";
import { getActiveStatusNames } from "@/lib/statuses";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EngagementsPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const statusFilter = searchParams.status && searchParams.status !== "ALL" ? searchParams.status : undefined;
  const q = searchParams.q ?? undefined;

  const engagements = await prisma.engagement.findMany({
    where: {
      ...(statusFilter ? { status: statusFilter as any } : {}),
      ...(q ? {
        OR: [
          { client:         { contains: q, mode: "insensitive" } },
          { service:        { contains: q, mode: "insensitive" } },
          { referralSource: { contains: q, mode: "insensitive" } },
          { consultant: { name: { contains: q, mode: "insensitive" } } },
        ],
      } : {}),
    },
    include: {
      consultant: { select: { id: true, name: true } },
      _count:     { select: { attachments: true, notes: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const statuses = ["ALL", ...(await getActiveStatusNames())];
  const current  = searchParams.status ?? "ALL";

  return (
    <Shell>
      <div className="max-w-container mx-auto px-gutter py-7">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-black text-heading tracking-tight">Engagements</h1>
          <Link href="/engagements/new" className="otg-btn otg-btn--primary otg-btn--sm">
            + New engagement
          </Link>
        </div>

        {/* Filters */}
        <form method="GET" className="flex flex-wrap gap-3 mb-5 items-center">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search client, consultant, service…"
            className="otg-input max-w-xs"
          />
          <div className="flex gap-1.5 flex-wrap">
            {statuses.map(s => (
              <Link
                key={s}
                href={`/engagements?status=${encodeURIComponent(s)}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                className={`otg-btn otg-btn--sm ${
                  current === s ? "otg-btn--primary" : "otg-btn--ghost"
                }`}
              >
                {s === "ALL" ? "All" : s}
              </Link>
            ))}
          </div>
          <button type="submit" className="otg-btn otg-btn--outline otg-btn--sm">Search</button>
        </form>

        {/* Table */}
        <div className="otg-card otg-card--flat p-0 overflow-hidden">
          {engagements.length === 0 ? (
            <div className="px-5 py-16 text-center text-muted text-sm">
              No engagements found.{" "}
              <Link href="/engagements/new" className="text-link font-semibold hover:underline">Create one.</Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-soft-ivory text-xs font-semibold text-muted uppercase tracking-eyebrow border-b border-border-subtle">
                  <th className="text-left px-5 py-3">Client</th>
                  <th className="text-left px-5 py-3">Service</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Consultant</th>
                  <th className="text-left px-5 py-3">Referral</th>
                  <th className="text-right px-5 py-3">Fee</th>
                  <th className="text-right px-5 py-3">Gross</th>
                  <th className="text-right px-5 py-3">Net</th>
                  <th className="text-right px-5 py-3">Due</th>
                </tr>
              </thead>
              <tbody>
                {engagements.map(e => (
                  <tr key={e.id} className="border-t border-border-subtle hover:bg-soft-ivory transition-colors duration-fast">
                    <td className="px-5 py-3.5">
                      <Link href={`/engagements/${e.id}`} className="font-semibold text-heading hover:text-link transition-colors duration-fast">
                        {e.client}
                      </Link>
                      {(e._count.attachments > 0 || e._count.notes > 0) && (
                        <div className="flex gap-2 mt-0.5">
                          {e._count.attachments > 0 && <span className="text-xs text-muted">{e._count.attachments} file{e._count.attachments !== 1 ? "s" : ""}</span>}
                          {e._count.notes > 0         && <span className="text-xs text-muted">{e._count.notes} note{e._count.notes !== 1 ? "s" : ""}</span>}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-muted max-w-[180px] truncate">{e.service}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={e.status} /></td>
                    <td className="px-5 py-3.5 text-muted">{e.consultant.name}</td>
                    <td className="px-5 py-3.5 text-muted text-xs">{e.referralSource ?? "—"}</td>
                    <td className="px-5 py-3.5 text-right font-semibold tabular-nums text-heading">
                      {e.agreedFee ? fmtCurrency(e.agreedFee) : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-muted">
                      {fmtPct(e.grossMargin)}
                    </td>
                    <td className={`px-5 py-3.5 text-right font-semibold tabular-nums ${
                      e.netMargin !== null && e.netMargin < 30 ? "text-warm-terracotta" : "text-rich-green"
                    }`}>
                      {fmtPct(e.netMargin)}
                    </td>
                    <td className="px-5 py-3.5 text-right text-muted text-xs">
                      {e.dueDate ? new Date(e.dueDate).toLocaleDateString("en-AU") : "—"}
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
