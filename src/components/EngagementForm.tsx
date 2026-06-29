"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { calcFinancials, fmtCurrency, fmtPct, JOTFORM_PER_ENGAGEMENT } from "@/lib/constants";

type Consultant = {
  id: string;
  name: string;
  roleCard: { role: string; hourlyCost: number; chargeRate: number } | null;
};

type Row = { key: string; userId: string; date: string; hours: string };

interface Props {
  consultants: Consultant[];
  services: string[];
  statuses: string[];
  defaultStatus?: string;
  engagement?: any;
  defaultConsultantId?: string;
  mode: "create" | "edit";
}

function fmtDate(d: Date | string | null | undefined) {
  if (!d) return "";
  return (typeof d === "string" ? new Date(d) : d).toISOString().split("T")[0];
}

function today() {
  return new Date().toISOString().split("T")[0];
}

export default function EngagementForm({ consultants, services, statuses, defaultStatus, engagement, defaultConsultantId, mode }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const keyRef = useRef(0);
  const nextKey = () => `r${keyRef.current++}`;

  // Keep the engagement's current type/status selectable even if it was since deactivated/removed.
  const serviceOptions = engagement?.service && !services.includes(engagement.service)
    ? [engagement.service, ...services]
    : services;
  const statusOptions = engagement?.status && !statuses.includes(engagement.status)
    ? [engagement.status, ...statuses]
    : statuses;

  const [form, setForm] = useState({
    client:          engagement?.client         ?? "",
    clientNo:        engagement?.clientNo        ?? "",
    service:         engagement?.service        ?? services[0] ?? "",
    status:          engagement?.status         ?? defaultStatus ?? statuses[0] ?? "",
    consultantId:    engagement?.consultantId   ?? defaultConsultantId ?? "",
    referralSource:  engagement?.referralSource ?? "",
    referralPct:     engagement?.referralPct    != null ? String(engagement.referralPct) : "",
    startDate:       fmtDate(engagement?.startDate),
    dueDate:         fmtDate(engagement?.dueDate),
    details:         engagement?.details        ?? "",
    agreedFee:       engagement?.agreedFee      != null ? String(engagement.agreedFee) : "",
    jotformCost:     engagement?.jotformCost    != null ? String(engagement.jotformCost) : "",
  });

  const [rows, setRows] = useState<Row[]>(() =>
    (engagement?.timeEntries ?? []).map((t: any) => ({
      key: nextKey(),
      userId: t.userId,
      date: fmtDate(t.date),
      hours: String(t.hours),
    }))
  );

  const set = (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  const addRow    = () => setRows(rs => [...rs, { key: nextKey(), userId: form.consultantId || "", date: today(), hours: "" }]);
  const removeRow = (key: string) => setRows(rs => rs.filter(r => r.key !== key));
  const setRow    = (key: string, field: keyof Row, value: string) =>
    setRows(rs => rs.map(r => (r.key === key ? { ...r, [field]: value } : r)));

  const rateOf = (userId: string) => consultants.find(c => c.id === userId)?.roleCard ?? null;

  const fee         = parseFloat(form.agreedFee)   || 0;
  const jotform     = parseFloat(form.jotformCost) || 0;
  const referralPct = parseFloat(form.referralPct) || 0;

  const lines = rows
    .filter(r => r.userId && parseFloat(r.hours) > 0)
    .map(r => {
      const rc = rateOf(r.userId);
      return { hours: parseFloat(r.hours) || 0, costRate: rc?.hourlyCost ?? 0, chargeRate: rc?.chargeRate ?? 0 };
    });

  const { directCost, chargeoutValue, referralFee, grossMargin, netMargin, totalHours } =
    calcFinancials(fee, lines, jotform, referralPct);
  const showCalc = fee > 0 || totalHours > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.client.trim() || !form.consultantId) { setError("Client name and lead consultant are required."); return; }
    setSaving(true);
    setError("");

    const timeEntries = rows
      .filter(r => r.userId && parseFloat(r.hours) > 0)
      .map(r => ({ userId: r.userId, date: r.date || today(), hours: parseFloat(r.hours) || 0 }));

    const res = await fetch(
      mode === "edit" ? `/api/engagements/${engagement.id}` : "/api/engagements",
      {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, agreedFee: fee, jotformCost: jotform, referralPct, timeEntries }),
      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      setSaving(false);
      return;
    }
    const saved = await res.json();
    router.push(`/engagements/${saved.id}`);
    router.refresh();
  }

  const inputCls    = "otg-input";
  const labelCls    = "otg-field__label";
  const hintCls     = "otg-field__hint";
  const fieldCls    = "otg-field";
  const sectionHead = "text-xs font-semibold text-muted uppercase tracking-eyebrow mb-4";

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-5">

        {/* ── Left column ── */}
        <div className="flex flex-col gap-5">
          <div className="otg-card otg-card--ivory">
            <p className={sectionHead}>Engagement</p>
            <div className="flex flex-col gap-4">
              <div className={fieldCls}>
                <label className={labelCls}>Client / organisation</label>
                <input className={inputCls} value={form.client} onChange={set("client")} required />
              </div>
              <div className={fieldCls}>
                <label className={labelCls}>Client number</label>
                <input className={inputCls} value={form.clientNo} onChange={set("clientNo")} placeholder="Internal client reference" />
              </div>
              <div className={fieldCls}>
                <label className={labelCls}>Service</label>
                <select className={inputCls} value={form.service} onChange={set("service")}>
                  {serviceOptions.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className={fieldCls}>
                <label className={labelCls}>Status</label>
                <select className={inputCls} value={form.status} onChange={set("status")}>
                  {statusOptions.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className={fieldCls}>
                <label className={labelCls}>Scope notes</label>
                <textarea className={inputCls} value={form.details} onChange={set("details")} rows={4} />
              </div>
            </div>
          </div>

          <div className="otg-card otg-card--ivory">
            <p className={sectionHead}>People</p>
            <div className="flex flex-col gap-4">
              <div className={fieldCls}>
                <label className={labelCls}>Lead consultant</label>
                <select className={inputCls} value={form.consultantId} onChange={set("consultantId")} required>
                  <option value="">— Select —</option>
                  {consultants.map(u => <option key={u.id} value={u.id}>{u.name}{u.roleCard ? ` (${u.roleCard.role})` : ""}</option>)}
                </select>
              </div>
              <div className={fieldCls}>
                <label className={labelCls}>Referral source</label>
                <input className={inputCls} value={form.referralSource} onChange={set("referralSource")} placeholder="Who originated or referred this work" />
              </div>
              <div className={fieldCls}>
                <label className={labelCls}>Referral fee (% of agreed fee)</label>
                <span className={hintCls}>Percentage of billed revenue paid to the referrer — leave at 0 if none</span>
                <input type="number" step="0.5" min="0" max="100" className={inputCls} value={form.referralPct} onChange={set("referralPct")} placeholder="0" />
              </div>
            </div>
          </div>

          <div className="otg-card otg-card--ivory">
            <p className={sectionHead}>Timeline</p>
            <div className="flex flex-col gap-4">
              <div className={fieldCls}>
                <label className={labelCls}>Start date</label>
                <input type="date" className={inputCls} value={form.startDate} onChange={set("startDate")} />
              </div>
              <div className={fieldCls}>
                <label className={labelCls}>Due / target completion</label>
                <input type="date" className={inputCls} value={form.dueDate} onChange={set("dueDate")} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="flex flex-col gap-5">
          <div className="otg-card otg-card--ivory">
            <p className={sectionHead}>Financials</p>
            <div className="flex flex-col gap-4">
              <div className={fieldCls}>
                <label className={labelCls}>Agreed fee (AUD excl. GST)</label>
                <input type="number" step="0.01" min="0" className={inputCls} value={form.agreedFee} onChange={set("agreedFee")} />
              </div>
              <div className={fieldCls}>
                <label className={labelCls}>JotForm apportionment ($)</label>
                <span className={hintCls}>${JOTFORM_PER_ENGAGEMENT} per engagement, or $408/yr if 4+ engagements</span>
                <input type="number" step="0.01" min="0" className={inputCls} value={form.jotformCost} onChange={set("jotformCost")} />
              </div>
            </div>
          </div>

          {showCalc && (
            <div className="otg-card otg-card--tint">
              <p className={sectionHead}>Live estimate</p>
              <div className="flex flex-col gap-2 text-sm">
                {[
                  ["Total hours",      `${totalHours.toFixed(1)} hrs`],
                  ["Direct cost",      fmtCurrency(directCost)],
                  ["Charge-out value", fmtCurrency(chargeoutValue)],
                  ["Agreed fee",       fee > 0 ? fmtCurrency(fee) : "—"],
                  ...(referralPct > 0 ? [[`Referral fee (${referralPct}%)`, fmtCurrency(referralFee)]] : []),
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-muted">{label}</span>
                    <span className="font-semibold tabular-nums text-heading">{val}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-3 mt-1 border-t border-rich-green-300">
                  <span className="font-semibold text-heading">Gross margin <span className="text-muted font-normal">(firm)</span></span>
                  <span className={`font-black text-lg tabular-nums ${grossMargin !== null && grossMargin < 30 ? "text-warm-terracotta" : "text-rich-green"}`}>
                    {fmtPct(grossMargin)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-heading">Net margin <span className="text-muted font-normal">(practice)</span></span>
                  <span className={`font-black text-lg tabular-nums ${netMargin !== null && netMargin < 30 ? "text-warm-terracotta" : "text-rich-green"}`}>
                    {fmtPct(netMargin)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Timesheet (full width) ── */}
      <div className="otg-card otg-card--ivory mt-5">
        <div className="flex items-center justify-between mb-4">
          <p className={`${sectionHead} mb-0`}>Timesheet</p>
          <button type="button" onClick={addRow} className="otg-btn otg-btn--ghost otg-btn--sm">+ Add entry</button>
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-muted">No time logged yet. Add an entry to build up the cost and charge-out.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-semibold text-muted uppercase tracking-eyebrow border-b border-border-strong">
                <th className="text-left py-2 pr-3">Consultant</th>
                <th className="text-left py-2 pr-3">Date</th>
                <th className="text-right py-2 pr-3">Hours</th>
                <th className="text-right py-2 pr-3">Cost</th>
                <th className="text-right py-2 pr-3">Charge-out</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const rc = rateOf(r.userId);
                const hrs = parseFloat(r.hours) || 0;
                return (
                  <tr key={r.key} className="border-b border-border-subtle last:border-0">
                    <td className="py-2 pr-3">
                      <select className={`${inputCls} py-2`} value={r.userId} onChange={e => setRow(r.key, "userId", e.target.value)}>
                        <option value="">— Select —</option>
                        {consultants.map(u => <option key={u.id} value={u.id}>{u.name}{u.roleCard ? ` (${u.roleCard.role})` : ""}</option>)}
                      </select>
                    </td>
                    <td className="py-2 pr-3">
                      <input type="date" className={`${inputCls} py-2`} value={r.date} onChange={e => setRow(r.key, "date", e.target.value)} />
                    </td>
                    <td className="py-2 pr-3 w-24">
                      <input type="number" step="0.25" min="0" className={`${inputCls} py-2 text-right`} value={r.hours} onChange={e => setRow(r.key, "hours", e.target.value)} />
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums text-muted">{rc ? fmtCurrency(hrs * rc.hourlyCost) : "—"}</td>
                    <td className="py-2 pr-3 text-right tabular-nums text-muted">{rc ? fmtCurrency(hrs * rc.chargeRate) : "—"}</td>
                    <td className="py-2 text-right">
                      <button type="button" onClick={() => removeRow(r.key)} className="text-warm-terracotta hover:text-warm-terracotta-700 text-sm font-semibold" aria-label="Remove entry">✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-border-strong font-semibold text-heading">
                <td className="py-2 pr-3" colSpan={2}>Total</td>
                <td className="py-2 pr-3 text-right tabular-nums">{totalHours.toFixed(1)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{fmtCurrency(directCost - jotform)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{fmtCurrency(chargeoutValue)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {error && (
        <p className="mt-4 text-sm text-warm-terracotta bg-apricot-blush-200 px-4 py-3 rounded-md">{error}</p>
      )}

      <div className="flex gap-3 justify-end mt-5">
        <button type="button" onClick={() => router.back()} className="otg-btn otg-btn--ghost otg-btn--md">
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !form.client.trim()}
          className="otg-btn otg-btn--primary otg-btn--md"
        >
          {saving ? "Saving…" : mode === "edit" ? "Save changes" : "Create engagement"}
        </button>
      </div>
    </form>
  );
}
