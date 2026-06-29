import { cache } from "react";
import { prisma } from "@/lib/prisma";

export type StatusRow = {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
  active: boolean;
  isDefault: boolean;
};

// Cached per request — many StatusBadge instances on a page share one query.
export const getStatuses = cache(async (): Promise<StatusRow[]> => {
  return prisma.status.findMany({
    orderBy: [{ active: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
  });
});

export async function getActiveStatusNames(): Promise<string[]> {
  return (await getStatuses()).filter((s) => s.active).map((s) => s.name);
}

export async function getDefaultStatusName(): Promise<string> {
  const all = await getStatuses();
  return all.find((s) => s.isDefault && s.active)?.name ?? all.find((s) => s.active)?.name ?? "Enquiry";
}
