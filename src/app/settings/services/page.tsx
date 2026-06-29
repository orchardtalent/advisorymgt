import { prisma } from "@/lib/prisma";
import ServiceManager from "@/components/ServiceManager";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const services = await prisma.service.findMany({
    orderBy: [{ active: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <div>
      <p className="text-sm text-muted mb-5 max-w-narrow">
        The list of engagement types offered when creating or editing an engagement. Inactive types are hidden from the dropdown; deleting one never changes engagements already recorded against it.
      </p>
      <ServiceManager initial={JSON.parse(JSON.stringify(services))} />
    </div>
  );
}
