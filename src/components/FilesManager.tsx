"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FILE_CATEGORIES } from "@/lib/constants";

type FileRow = {
  id: string;
  category: string;
  title: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  uploadedBy: { name: string } | null;
};

function fmtSize(n: number) {
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
}

export default function FilesManager({ engagementId, initial }: { engagementId: string; initial: FileRow[] }) {
  const router = useRouter();
  const [files, setFiles] = useState<FileRow[]>(initial);
  const [category, setCategory] = useState<string>(FILE_CATEGORIES[0]);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const when = (s: string) => new Date(s).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });

  async function upload() {
    const f = fileRef.current?.files?.[0];
    if (!f) { setError("Choose a file first"); return; }
    setBusy(true); setError("");
    const fd = new FormData();
    fd.append("file", f);
    fd.append("category", category);
    fd.append("title", title);
    const res = await fetch(`/api/engagements/${engagementId}/files`, { method: "POST", body: fd });
    setBusy(false);
    if (!res.ok) { setError((await res.json().catch(() => ({}))).error ?? "Upload failed"); return; }
    const row = await res.json();
    setFiles(fs => [row, ...fs]);
    setTitle("");
    if (fileRef.current) fileRef.current.value = "";
    router.refresh();
  }

  async function remove(f: FileRow) {
    if (!confirm(`Delete "${f.title}"? This permanently removes the file.`)) return;
    setBusy(true); setError("");
    const res = await fetch(`/api/files/${f.id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) { setError((await res.json().catch(() => ({}))).error ?? "Delete failed"); return; }
    setFiles(fs => fs.filter(x => x.id !== f.id));
    router.refresh();
  }

  // Order by category (as listed), then newest first.
  const ordered = [...files].sort((a, b) => {
    const ci = FILE_CATEGORIES.indexOf(a.category as any) - FILE_CATEGORIES.indexOf(b.category as any);
    return ci !== 0 ? ci : (a.createdAt < b.createdAt ? 1 : -1);
  });

  return (
    <div className="otg-card otg-card--ivory mb-5">
      <p className="text-xs font-semibold text-muted uppercase tracking-eyebrow mb-3">Files &amp; deliverables</p>

      {/* Upload */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="otg-field">
          <label className="otg-field__hint">Category</label>
          <select className="otg-input py-2" value={category} onChange={e => setCategory(e.target.value)}>
            {FILE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="otg-field flex-1 min-w-[180px]">
          <label className="otg-field__hint">Title (optional)</label>
          <input className="otg-input py-2" placeholder="Defaults to the file name" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="otg-field">
          <label className="otg-field__hint">File</label>
          <input ref={fileRef} type="file" className="otg-input py-2" />
        </div>
        <button onClick={upload} disabled={busy} className="otg-btn otg-btn--primary otg-btn--sm">Upload</button>
      </div>

      {error && <p className="text-sm text-warm-terracotta bg-apricot-blush-200 px-3 py-2 rounded-md mb-3">{error}</p>}

      {ordered.length === 0 ? (
        <p className="text-sm text-muted">No files uploaded yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs font-semibold text-muted uppercase tracking-eyebrow border-b border-border-strong">
              <th className="text-left py-2 pr-3 w-48">Category</th>
              <th className="text-left py-2 pr-3">File</th>
              <th className="text-left py-2 pr-3 w-32">Uploaded by</th>
              <th className="text-left py-2 pr-3 w-28">Date</th>
              <th className="text-right py-2 pr-3 w-20">Size</th>
              <th className="py-2 w-40"></th>
            </tr>
          </thead>
          <tbody>
            {ordered.map(f => (
              <tr key={f.id} className="border-b border-border-subtle last:border-0">
                <td className="py-2 pr-3"><span className="otg-badge otg-badge--mint">{f.category}</span></td>
                <td className="py-2 pr-3">
                  <span className="font-semibold text-heading">{f.title}</span>
                  {f.title !== f.fileName && <span className="block text-xs text-muted">{f.fileName}</span>}
                </td>
                <td className="py-2 pr-3 text-muted">{f.uploadedBy?.name ?? "—"}</td>
                <td className="py-2 pr-3 text-muted text-xs">{when(f.createdAt)}</td>
                <td className="py-2 pr-3 text-right tabular-nums text-muted text-xs">{fmtSize(f.size)}</td>
                <td className="py-2 text-right whitespace-nowrap">
                  <a href={`/api/files/${f.id}?dl=1`} className="text-xs font-semibold text-link hover:text-link-hover mr-3">Download</a>
                  <button onClick={() => remove(f)} disabled={busy} className="text-xs font-semibold text-warm-terracotta hover:text-warm-terracotta-700">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
