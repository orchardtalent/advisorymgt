"use client";

export default function PrintButton({ label = "Download PDF" }: { label?: string }) {
  return (
    <button onClick={() => window.print()} className="otg-btn otg-btn--primary otg-btn--sm print:hidden">
      {label}
    </button>
  );
}
