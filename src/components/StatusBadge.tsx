import { getStatuses } from "@/lib/statuses";

// Server component — colour comes from the editable Status table (cached per request).
export default async function StatusBadge({ status }: { status: string }) {
  const statuses = await getStatuses();
  const color = statuses.find((s) => s.name === status)?.color ?? "outline";
  return <span className={`otg-badge otg-badge--${color}`}>{status}</span>;
}
