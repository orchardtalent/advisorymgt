"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { fmtCurrency } from "@/lib/constants";

type Card = {
  id: string;
  role: string;
  hourlyCost: number;
  chargeRate: number;
  active: boolean;
  sortOrder: number;
  _count?: { consultants: number };
};

export default function RateCardManager({ initial }: { initial: Card[] }) {
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>(initial);
  const [busy, setBusy]   = useState<string | null>(null);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({ role: "", hourlyCost: "", chargeRate: "" });

  const edit = (id: string, field: keyof Card, value: string | boolean) =>
    setCards(cs => cs.map(c => (c.id === id ? { ...c, [field]: value } : c)));

  async function save(card: Card) {
    setBusy(card.id); setError("");
    const res = await fetch(`/api/ratecards/${card.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: card.role,
        hourlyCost: Number(card.hourlyCost) || 0,
        chargeRate: Number(card.chargeRate) || 0,
        active: card.active,
        sortOrder: Number(card.sortOrder) || 0,
      }),
    });
    setBusy(null);
    if (!res.ok) { setError((await res.json().catch(() => ({}))).error ?? "Save failed"); return; }
    router.refresh();
  }

  async function remove(card: Card) {
    if (!confirm(`Delete the "${card.role}" rate card?`)) return;
    setBusy(card.id); setError("");
    const res = await fetch(`/api/ratecards/${card.id}`, { method: "DELETE" });
    setBusy(null);
    if (!res.ok) { setError((await res.json().catch(() => ({}))).error ?? "Delete failed"); return; }
    setCards(cs => cs.filter(c => c.id !== card.id));
    router.refresh();
  }

  async function add() {
    if (!draft.role.trim()) { setError("Role name is required"); return; }
    setBusy("new"); setError("");
    const res = await fetch("/api/ratecards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: draft.role,
        hourlyCost: Number(draft.hourlyCost) || 0,
        chargeRate: Number(draft.chargeRate) || 0,
        sortOrder: cards.length + 1,
      }),
    });
    setBusy(null);
    if (!res.ok) { setError((await res.json().catch(() => ({}))).error ?? "Add failed"); return; }
    setDraft({ role: "", hourlyCost: "", chargeRate: "" });
    router.refresh();
  }

  const cell = "otg-input py-2";

  return (
    <div className="otg-card otg-card--flat p-0 overflow-hidden">
      {error && <p className="text-sm text-warm-terracotta bg-apricot-blush-200 px-5 py-3">{error}</p>}
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-soft-ivory text-xs font-semibold text-muted uppercase tracking-eyebrow border-b border-border-subtle">
            <th className="text-left px-5 py-3">Role</th>
            <th className="text-right px-3 py-3 w-40">Hourly cost</th>
            <th className="text-right px-3 py-3 w-40">Charge rate</th>
            <th className="text-center px-3 py-3 w-24">Active</th>
            <th className="text-right px-5 py-3 w-44"></th>
          </tr>
        </thead>
        <tbody>
          {cards.map(c => (
            <tr key={c.id} className="border-t border-border-subtle">
              <td className="px-5 py-2">
                <input className={cell} value={c.role} onChange={e => edit(c.id, "role", e.target.value)} />
              </td>
              <td className="px-3 py-2">
                <input type="number" step="0.01" min="0" className={`${cell} text-right`} value={c.hourlyCost} onChange={e => edit(c.id, "hourlyCost", e.target.value)} />
              </td>
              <td className="px-3 py-2">
                <input type="number" step="0.01" min="0" className={`${cell} text-right`} value={c.chargeRate} onChange={e => edit(c.id, "chargeRate", e.target.value)} />
              </td>
              <td className="px-3 py-2 text-center">
                <input type="checkbox" checked={c.active} onChange={e => edit(c.id, "active", e.target.checked)} />
              </td>
              <td className="px-5 py-2 text-right whitespace-nowrap">
                <button onClick={() => save(c)} disabled={busy === c.id} className="otg-btn otg-btn--primary otg-btn--sm mr-2">Save</button>
                <button onClick={() => remove(c)} disabled={busy === c.id} className="otg-btn otg-btn--ghost otg-btn--sm" title={c._count?.consultants ? `${c._count.consultants} consultant(s) use this` : ""}>Delete</button>
              </td>
            </tr>
          ))}
          <tr className="border-t border-border-strong bg-soft-ivory">
            <td className="px-5 py-3">
              <input className={cell} placeholder="New role" value={draft.role} onChange={e => setDraft(d => ({ ...d, role: e.target.value }))} />
            </td>
            <td className="px-3 py-3">
              <input type="number" step="0.01" min="0" className={`${cell} text-right`} placeholder="0.00" value={draft.hourlyCost} onChange={e => setDraft(d => ({ ...d, hourlyCost: e.target.value }))} />
            </td>
            <td className="px-3 py-3">
              <input type="number" step="0.01" min="0" className={`${cell} text-right`} placeholder="0.00" value={draft.chargeRate} onChange={e => setDraft(d => ({ ...d, chargeRate: e.target.value }))} />
            </td>
            <td></td>
            <td className="px-5 py-3 text-right">
              <button onClick={add} disabled={busy === "new"} className="otg-btn otg-btn--outline otg-btn--sm">+ Add rate</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
