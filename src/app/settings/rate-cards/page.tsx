import { prisma } from "@/lib/prisma";
import RateCardManager from "@/components/RateCardManager";

export const dynamic = "force-dynamic";

export default async function RateCardsPage() {
  const rateCards = await prisma.rateCard.findMany({
    orderBy: [{ active: "desc" }, { sortOrder: "asc" }, { role: "asc" }],
    include: { _count: { select: { consultants: true } } },
  });

  return (
    <div>
      <p className="text-sm text-muted mb-5 max-w-narrow">
        Cost and charge-out rates per consultant level. Editing a rate only affects time logged from now on — figures already recorded on engagements keep the rate they were logged at.
      </p>
      <RateCardManager initial={JSON.parse(JSON.stringify(rateCards))} />
    </div>
  );
}
