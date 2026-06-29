import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Shell from "@/components/Shell";
import EngagementForm from "@/components/EngagementForm";

export default async function EditEngagementPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [engagement, consultants, services] = await Promise.all([
    prisma.engagement.findUnique({
      where: { id: params.id },
      include: { timeEntries: { orderBy: { date: "asc" } } },
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
  ]);

  if (!engagement) notFound();

  return (
    <Shell>
      <div className="max-w-container mx-auto px-gutter py-8">
        <h1 className="text-2xl font-black text-heading tracking-tight mb-8">Edit engagement</h1>
        <EngagementForm
          consultants={consultants}
          services={services.map(s => s.name)}
          engagement={engagement}
          mode="edit"
        />
      </div>
    </Shell>
  );
}
