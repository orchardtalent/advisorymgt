import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Shell from "@/components/Shell";
import EngagementForm from "@/components/EngagementForm";
import NotesManager from "@/components/NotesManager";
import { getActiveStatusNames } from "@/lib/statuses";

export default async function EditEngagementPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [engagement, consultants, services, statusNames] = await Promise.all([
    prisma.engagement.findUnique({
      where: { id: params.id },
      include: {
        timeEntries: { orderBy: { date: "asc" } },
        notes: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } },
      },
    }),
    prisma.user.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        roleCard: { select: { role: true, hourlyCost: true, chargeRate: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.service.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { name: true },
    }),
    getActiveStatusNames(),
  ]);

  if (!engagement) notFound();

  return (
    <Shell>
      <div className="max-w-container mx-auto px-gutter py-8">
        <h1 className="text-2xl font-black text-heading tracking-tight mb-8">Edit engagement</h1>
        <EngagementForm
          consultants={consultants}
          services={services.map(s => s.name)}
          statuses={statusNames}
          engagement={engagement}
          mode="edit"
        />

        <div className="mt-6">
          <NotesManager engagementId={engagement.id} initial={JSON.parse(JSON.stringify(engagement.notes))} />
        </div>
      </div>
    </Shell>
  );
}
