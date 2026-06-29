"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type RateCard = { id: string; role: string };
type Consultant = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  canManage: boolean;
  roleId: string | null;
  roleCard: { role: string } | null;
  _count?: { engagements: number; timeEntries: number };
};

export default function ConsultantManager({ initial, rateCards }: { initial: Consultant[]; rateCards: RateCard[] }) {
  const router = useRouter();
  const [people, setPeople] = useState<Consultant[]>(initial);
  const [busy, setBusy]     = useState<string | null>(null);
  const [error, setError]   = useState("");
  const [draft, setDraft]   = useState({ name: "", email: "", roleId: "", password: "", canManage: false });

  const edit = (id: string, field: keyof Consultant, value: any) =>
    setPeople(ps => ps.map(p => (p.id === id ? { ...p, [field]: value } : p)));

  async function save(p: Consultant) {
    setBusy(p.id); setError("");
    const res = await fetch(`/api/users/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: p.name, email: p.email, roleId: p.roleId, canManage: p.canManage, active: p.active }),
    });
    setBusy(null);
    if (!res.ok) { setError((await res.json().catch(() => ({}))).error ?? "Save failed"); return; }
    router.refresh();
  }

  async function deactivate(p: Consultant) {
    if (!confirm(`Deactivate ${p.name}? They will be hidden from selection but their history is kept.`)) return;
    setBusy(p.id); setError("");
    const res = await fetch(`/api/users/${p.id}`, { method: "DELETE" });
    setBusy(null);
    if (!res.ok) { setError((await res.json().catch(() => ({}))).error ?? "Failed"); return; }
    router.refresh();
  }

  async function add() {
    if (!draft.name.trim() || !draft.email.trim()) { setError("Name and email are required"); return; }
    setBusy("new"); setError("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    setBusy(null);
    if (!res.ok) { setError((await res.json().catch(() => ({}))).error ?? "Add failed"); return; }
    setDraft({ name: "", email: "", roleId: "", password: "", canManage: false });
    router.refresh();
  }

  const cell = "otg-input py-2";

  return (
    <div className="otg-card otg-card--flat p-0 overflow-hidden">
      {error && <p className="text-sm text-warm-terracotta bg-apricot-blush-200 px-5 py-3">{error}</p>}
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-soft-ivory text-xs font-semibold text-muted uppercase tracking-eyebrow border-b border-border-subtle">
            <th className="text-left px-5 py-3">Name</th>
            <th className="text-left px-3 py-3">Email</th>
            <th className="text-left px-3 py-3 w-56">Role</th>
            <th className="text-center px-3 py-3 w-20">Active</th>
            <th className="text-right px-5 py-3 w-44"></th>
          </tr>
        </thead>
        <tbody>
          {people.map(p => (
            <tr key={p.id} className={`border-t border-border-subtle ${p.active ? "" : "opacity-60"}`}>
              <td className="px-5 py-2"><input className={cell} value={p.name} onChange={e => edit(p.id, "name", e.target.value)} /></td>
              <td className="px-3 py-2"><input className={cell} value={p.email} onChange={e => edit(p.id, "email", e.target.value)} /></td>
              <td className="px-3 py-2">
                <select className={cell} value={p.roleId ?? ""} onChange={e => edit(p.id, "roleId", e.target.value || null)}>
                  <option value="">— No role —</option>
                  {rateCards.map(rc => <option key={rc.id} value={rc.id}>{rc.role}</option>)}
                </select>
              </td>
              <td className="px-3 py-2 text-center"><input type="checkbox" checked={p.active} onChange={e => edit(p.id, "active", e.target.checked)} /></td>
              <td className="px-5 py-2 text-right whitespace-nowrap">
                <button onClick={() => save(p)} disabled={busy === p.id} className="otg-btn otg-btn--primary otg-btn--sm mr-2">Save</button>
                <button onClick={() => deactivate(p)} disabled={busy === p.id} className="otg-btn otg-btn--ghost otg-btn--sm">Deactivate</button>
              </td>
            </tr>
          ))}
          <tr className="border-t border-border-strong bg-soft-ivory">
            <td className="px-5 py-3"><input className={cell} placeholder="Full name" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} /></td>
            <td className="px-3 py-3"><input className={cell} placeholder="email@orchardtalent.com.au" value={draft.email} onChange={e => setDraft(d => ({ ...d, email: e.target.value }))} /></td>
            <td className="px-3 py-3">
              <select className={cell} value={draft.roleId} onChange={e => setDraft(d => ({ ...d, roleId: e.target.value }))}>
                <option value="">— No role —</option>
                {rateCards.map(rc => <option key={rc.id} value={rc.id}>{rc.role}</option>)}
              </select>
            </td>
            <td></td>
            <td className="px-5 py-3 text-right"><button onClick={add} disabled={busy === "new"} className="otg-btn otg-btn--outline otg-btn--sm">+ Add consultant</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
