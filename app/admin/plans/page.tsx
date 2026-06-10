import { prisma } from "@/lib/prisma";
import PlansClient from "./PlansClient";

export default async function AdminPlans() {
  const plans = await prisma.plan.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { contracts: true } } },
  });

  return <PlansClient plans={plans} />;
}
