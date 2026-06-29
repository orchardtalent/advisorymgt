import { prisma } from "@/lib/prisma";
import StatusManager from "@/components/StatusManager";

export const dynamic = "force-dynamic";

export default async function StatusesPage() {
  const statuses = await prisma.status.findMany({
    orderBy: [{ active: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <div>
      <p className="text-sm text-muted mb-5 max-w-narrow">
        The statuses an engagement can move through. Reorder them, recolour their badges, set the one new engagements start at, and hide or remove ones you don’t use.
      </p>
      <StatusManager initial={JSON.parse(JSON.stringify(statuses))} />
    </div>
  );
}
