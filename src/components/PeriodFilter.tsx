import Link from "next/link";
import { PERIOD_OPTIONS, PeriodKey } from "@/lib/period";

// Server component: preset links + a custom-range GET form. No client JS needed.
export default function PeriodFilter({
  basePath,
  current,
  from,
  to,
}: {
  basePath: string;
  current: PeriodKey;
  from?: string;
  to?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 print:hidden">
      <div className="flex gap-1.5 flex-wrap">
        {PERIOD_OPTIONS.map(o => (
          <Link
            key={o.key}
            href={`${basePath}?period=${o.key}`}
            className={`otg-btn otg-btn--sm ${current === o.key ? "otg-btn--primary" : "otg-btn--ghost"}`}
          >
            {o.label}
          </Link>
        ))}
      </div>

      <form method="GET" action={basePath} className="flex items-end gap-2">
        <input type="hidden" name="period" value="custom" />
        <div className="otg-field">
          <label className="otg-field__hint">From</label>
          <input type="date" name="from" defaultValue={from} className="otg-input py-2" />
        </div>
        <div className="otg-field">
          <label className="otg-field__hint">To</label>
          <input type="date" name="to" defaultValue={to} className="otg-input py-2" />
        </div>
        <button type="submit" className={`otg-btn otg-btn--sm ${current === "custom" ? "otg-btn--primary" : "otg-btn--outline"}`}>
          Apply
        </button>
      </form>
    </div>
  );
}
