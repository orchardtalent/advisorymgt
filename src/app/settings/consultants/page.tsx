import { prisma } from "@/lib/prisma";
import ConsultantManager from "@/components/ConsultantManager";

export const dynamic = "force-dynamic";

export default async function ConsultantsPage() {
  const [consultants, rateCards] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ active: "desc" }, { name: "asc" }],
      select: {
        id: true, name: true, email: true, active: true, canManage: true, roleId: true,
        roleCard: { select: { role: true } },
        _count: { select: { engagements: true, timeEntries: true } },
      },
    }),
    prisma.rateCard.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, select: { id: true, role: true } }),
  ]);

  return (
    <div>
      <p className="text-sm text-muted mb-5 max-w-narrow">
        The people who deliver engagements. Each consultant's role sets the cost and charge-out rate used on their timesheet entries. A consultant only needs a password if they will sign in.
      </p>
      <ConsultantManager
        initial={JSON.parse(JSON.stringify(consultants))}
        rateCards={JSON.parse(JSON.stringify(rateCards))}
      />
    </div>
  );
}
