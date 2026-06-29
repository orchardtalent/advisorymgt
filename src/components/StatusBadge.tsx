import { STATUS_LABELS } from "@/lib/constants";

// Maps engagement status to OTG badge variants
const STATUS_BADGE: Record<string, string> = {
  ENQUIRY:   "otg-badge otg-badge--outline",
  ACTIVE:    "otg-badge otg-badge--green",
  COMPLETED: "otg-badge otg-badge--teal",
  ON_HOLD:   "otg-badge otg-badge--apricot",
  DECLINED:  "otg-badge otg-badge--terracotta",
};

export default function StatusBadge({ status }: { status: string }) {
  const cls   = STATUS_BADGE[status] ?? "otg-badge otg-badge--outline";
  const label = STATUS_LABELS[status] ?? status;
  return <span className={cls}>{label}</span>;
}
