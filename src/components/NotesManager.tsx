"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Note = {
  id: string;
  content: string;
  system: boolean;
  createdAt: string;
  author: { name: string } | null;
};

export default function NotesManager({ engagementId, initial }: { engagementId: string; initial: Note[] }) {
  const router = useRouter();
  const [notes, setNotes]   = useState<Note[]>(initial);
  const [draft, setDraft]   = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText]   = useState("");
  const [busy, setBusy]     = useState(false);
  const [error, setError]   = useState("");

  const when = (s: string) => new Date(s).toLocaleString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  async function add() {
    if (!draft.trim()) return;
    setBusy(true); setError("");
    const res = await fetch(`/api/engagements/${engagementId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: draft }),
    });
    setBusy(false);
    if (!res.ok) { setError((await res.json().catch(() => ({}))).error ?? "Couldn't add note"); return; }
    const note = await res.json();
    setNotes(ns => [note, ...ns]);
    setDraft("");
    router.refresh();
  }

  async function saveEdit(id: string) {
    if (!editText.trim()) return;
    setBusy(true); setError("");
    const res = await fetch(`/api/notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editText }),
    });
    setBusy(false);
    if (!res.ok) { setError((await res.json().catch(() => ({}))).error ?? "Couldn't save note"); return; }
    const note = await res.json();
    setNotes(ns => ns.map(n => (n.id === id ? { ...n, content: note.content } : n)));
    setEditingId(null); setEditText("");
    router.refresh();
  }

  return (
    <div className="otg-card otg-card--ivory">
      <p className="text-xs font-semibold text-muted uppercase tracking-eyebrow mb-3">Notes &amp; activity</p>

      {/* Add note */}
      <div className="flex flex-col gap-2 mb-4">
        <textarea
          className="otg-input"
          rows={2}
          placeholder="Add a note…"
          value={draft}
          onChange={e => setDraft(e.target.value)}
        />
        <div className="flex justify-end">
          <button onClick={add} disabled={busy || !draft.trim()} className="otg-btn otg-btn--primary otg-btn--sm">Add note</button>
        </div>
      </div>

      {error && <p className="text-sm text-warm-terracotta bg-apricot-blush-200 px-3 py-2 rounded-md mb-3">{error}</p>}

      {notes.length === 0 ? (
        <p className="text-sm text-muted">No notes yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs font-semibold text-muted uppercase tracking-eyebrow border-b border-border-strong">
              <th className="text-left py-2 pr-3 w-40">When</th>
              <th className="text-left py-2 pr-3 w-32">Who</th>
              <th className="text-left py-2">Note</th>
              <th className="py-2 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {notes.map(n => (
              <tr key={n.id} className="border-b border-border-subtle last:border-0 align-top">
                <td className="py-2 pr-3 text-xs text-muted whitespace-nowrap">{when(n.createdAt)}</td>
                <td className="py-2 pr-3 text-muted">{n.author?.name ?? "—"}</td>
                <td className="py-2">
                  {editingId === n.id ? (
                    <textarea className="otg-input" rows={2} value={editText} onChange={e => setEditText(e.target.value)} />
                  ) : n.system ? (
                    <span className="italic text-muted">{n.content}</span>
                  ) : (
                    <span className="text-body whitespace-pre-wrap">{n.content}</span>
                  )}
                </td>
                <td className="py-2 text-right whitespace-nowrap">
                  {n.system ? null : editingId === n.id ? (
                    <>
                      <button onClick={() => saveEdit(n.id)} disabled={busy} className="otg-btn otg-btn--primary otg-btn--sm">Save</button>
                      <button onClick={() => { setEditingId(null); setEditText(""); }} className="text-xs text-muted ml-2">Cancel</button>
                    </>
                  ) : (
                    <button onClick={() => { setEditingId(n.id); setEditText(n.content); }} className="text-xs font-semibold text-link hover:text-link-hover">Edit</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
