"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { STATUS_COLORS, STATUS_BADGE_CLASS } from "@/lib/constants";

type Status = {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
  active: boolean;
  isDefault: boolean;
};

export default function StatusManager({ initial }: { initial: Status[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Status[]>(initial);
  const [busy, setBusy]   = useState<string | null>(null);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({ name: "", color: "outline" });

  const edit = (id: string, field: keyof Status, value: any) =>
    setItems(xs => xs.map(x => (x.id === id ? { ...x, [field]: value } : x)));

  async function save(s: Status) {
    setBusy(s.id); setError("");
    const res = await fetch(`/api/statuses/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: s.name, color: s.color, sortOrder: Number(s.sortOrder) || 0, active: s.active, isDefault: s.isDefault }),
    });
    setBusy(null);
    if (!res.ok) { setError((await res.json().catch(() => ({}))).error ?? "Save failed"); return; }
    if (s.isDefault) setItems(xs => xs.map(x => ({ ...x, isDefault: x.id === s.id })));
    router.refresh();
  }

  async function remove(s: Status) {
    if (!confirm(`Delete the "${s.name}" status? Existing engagements keep their status.`)) return;
    setBusy(s.id); setError("");
    const res = await fetch(`/api/statuses/${s.id}`, { method: "DELETE" });
    setBusy(null);
    if (!res.ok) { setError((await res.json().catch(() => ({}))).error ?? "Delete failed"); return; }
    setItems(xs => xs.filter(x => x.id !== s.id));
    router.refresh();
  }

  async function add() {
    if (!draft.name.trim()) { setError("Name is required"); return; }
    setBusy("new"); setError("");
    const res = await fetch("/api/statuses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: draft.name, color: draft.color, sortOrder: items.length + 1 }),
    });
    setBusy(null);
    if (!res.ok) { setError((await res.json().catch(() => ({}))).error ?? "Add failed"); return; }
    setDraft({ name: "", color: "outline" });
    router.refresh();
  }

  const cell = "otg-input py-2";

  return (
    <div className="otg-card otg-card--flat p-0 overflow-hidden">
      {error && <p className="text-sm text-warm-terracotta bg-apricot-blush-200 px-5 py-3">{error}</p>}
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-soft-ivory text-xs font-semibold text-muted uppercase tracking-eyebrow border-b border-border-subtle">
            <th className="text-left px-5 py-3">Status</th>
            <th className="text-left px-3 py-3 w-44">Colour</th>
            <th className="text-left px-3 py-3 w-24">Preview</th>
            <th className="text-right px-3 py-3 w-20">Order</th>
            <th className="text-center px-3 py-3 w-20">Active</th>
            <th className="text-center px-3 py-3 w-20">Default</th>
            <th className="text-right px-5 py-3 w-40"></th>
          </tr>
        </thead>
        <tbody>
          {items.map(s => (
            <tr key={s.id} className="border-t border-border-subtle">
              <td className="px-5 py-2"><input className={cell} value={s.name} onChange={e => edit(s.id, "name", e.target.value)} /></td>
              <td className="px-3 py-2">
                <select className={cell} value={s.color} onChange={e => edit(s.id, "color", e.target.value)}>
                  {STATUS_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </td>
              <td className="px-3 py-2"><span className={STATUS_BADGE_CLASS[s.color] ?? STATUS_BADGE_CLASS.outline}>{s.name || "—"}</span></td>
              <td className="px-3 py-2"><input type="number" min="0" className={`${cell} text-right`} value={s.sortOrder} onChange={e => edit(s.id, "sortOrder", e.target.value)} /></td>
              <td className="px-3 py-2 text-center"><input type="checkbox" checked={s.active} onChange={e => edit(s.id, "active", e.target.checked)} /></td>
              <td className="px-3 py-2 text-center"><input type="checkbox" checked={s.isDefault} onChange={e => edit(s.id, "isDefault", e.target.checked)} /></td>
              <td className="px-5 py-2 text-right whitespace-nowrap">
                <button onClick={() => save(s)} disabled={busy === s.id} className="otg-btn otg-btn--primary otg-btn--sm mr-2">Save</button>
                <button onClick={() => remove(s)} disabled={busy === s.id} className="otg-btn otg-btn--ghost otg-btn--sm">Delete</button>
              </td>
            </tr>
          ))}
          <tr className="border-t border-border-strong bg-soft-ivory">
            <td className="px-5 py-3"><input className={cell} placeholder="New status" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} /></td>
            <td className="px-3 py-3">
              <select className={cell} value={draft.color} onChange={e => setDraft(d => ({ ...d, color: e.target.value }))}>
                {STATUS_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </td>
            <td className="px-3 py-3"><span className={STATUS_BADGE_CLASS[draft.color] ?? STATUS_BADGE_CLASS.outline}>{draft.name || "Preview"}</span></td>
            <td></td><td></td><td></td>
            <td className="px-5 py-3 text-right"><button onClick={add} disabled={busy === "new"} className="otg-btn otg-btn--outline otg-btn--sm">+ Add status</button></td>
          </tr>
        </tbody>
      </table>
      <p className="text-xs text-muted px-5 py-3 border-t border-border-subtle">
        “Default” is the status new engagements start at. Inactive statuses are hidden from the dropdown; deleting one never changes engagements already saved with it.
      </p>
    </div>
  );
}
