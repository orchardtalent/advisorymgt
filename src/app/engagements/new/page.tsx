import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Shell from "@/components/Shell";
import EngagementForm from "@/components/EngagementForm";

export default async function NewEngagementPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [consultants, services] = await Promise.all([
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

  const sessionUserId = (session.user as any)?.id as string | undefined;

  return (
    <Shell>
      <div className="max-w-container mx-auto px-gutter py-8">
        <h1 className="text-2xl font-black text-heading tracking-tight mb-8">New engagement</h1>
        <EngagementForm
          consultants={consultants}
          services={services.map(s => s.name)}
          defaultConsultantId={sessionUserId}
          mode="create"
        />
      </div>
    </Shell>
  );
}
