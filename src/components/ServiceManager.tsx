"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Service = {
  id: string;
  name: string;
  active: boolean;
  sortOrder: number;
};

export default function ServiceManager({ initial }: { initial: Service[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Service[]>(initial);
  const [busy, setBusy]   = useState<string | null>(null);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");

  const edit = (id: string, field: keyof Service, value: string | boolean) =>
    setItems(xs => xs.map(x => (x.id === id ? { ...x, [field]: value } : x)));

  async function save(s: Service) {
    setBusy(s.id); setError("");
    const res = await fetch(`/api/services/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: s.name, active: s.active, sortOrder: Number(s.sortOrder) || 0 }),
    });
    setBusy(null);
    if (!res.ok) { setError((await res.json().catch(() => ({}))).error ?? "Save failed"); return; }
    router.refresh();
  }

  async function remove(s: Service) {
    if (!confirm(`Delete the "${s.name}" engagement type? Existing engagements keep their type.`)) return;
    setBusy(s.id); setError("");
    const res = await fetch(`/api/services/${s.id}`, { method: "DELETE" });
    setBusy(null);
    if (!res.ok) { setError((await res.json().catch(() => ({}))).error ?? "Delete failed"); return; }
    setItems(xs => xs.filter(x => x.id !== s.id));
    router.refresh();
  }

  async function add() {
    if (!draft.trim()) { setError("Name is required"); return; }
    setBusy("new"); setError("");
    const res = await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: draft, sortOrder: items.length + 1 }),
    });
    setBusy(null);
    if (!res.ok) { setError((await res.json().catch(() => ({}))).error ?? "Add failed"); return; }
    setDraft("");
    router.refresh();
  }

  const cell = "otg-input py-2";

  return (
    <div className="otg-card otg-card--flat p-0 overflow-hidden">
      {error && <p className="text-sm text-warm-terracotta bg-apricot-blush-200 px-5 py-3">{error}</p>}
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-soft-ivory text-xs font-semibold text-muted uppercase tracking-eyebrow border-b border-border-subtle">
            <th className="text-left px-5 py-3">Engagement type</th>
            <th className="text-right px-3 py-3 w-28">Order</th>
            <th className="text-center px-3 py-3 w-24">Active</th>
            <th className="text-right px-5 py-3 w-44"></th>
          </tr>
        </thead>
        <tbody>
          {items.map(s => (
            <tr key={s.id} className="border-t border-border-subtle">
              <td className="px-5 py-2">
                <input className={cell} value={s.name} onChange={e => edit(s.id, "name", e.target.value)} />
              </td>
              <td className="px-3 py-2">
                <input type="number" min="0" className={`${cell} text-right`} value={s.sortOrder} onChange={e => edit(s.id, "sortOrder", e.target.value)} />
              </td>
              <td className="px-3 py-2 text-center">
                <input type="checkbox" checked={s.active} onChange={e => edit(s.id, "active", e.target.checked)} />
              </td>
              <td className="px-5 py-2 text-right whitespace-nowrap">
                <button onClick={() => save(s)} disabled={busy === s.id} className="otg-btn otg-btn--primary otg-btn--sm mr-2">Save</button>
                <button onClick={() => remove(s)} disabled={busy === s.id} className="otg-btn otg-btn--ghost otg-btn--sm">Delete</button>
              </td>
            </tr>
          ))}
          <tr className="border-t border-border-strong bg-soft-ivory">
            <td className="px-5 py-3">
              <input className={cell} placeholder="New engagement type" value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === "Enter") add(); }} />
            </td>
            <td></td>
            <td></td>
            <td className="px-5 py-3 text-right">
              <button onClick={add} disabled={busy === "new"} className="otg-btn otg-btn--outline otg-btn--sm">+ Add type</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
