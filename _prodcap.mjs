import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "node:fs";
const PROD = "postgres://postgres:7O4p8FvHNtp8MaNaNXCZYCF7CBQCzo4Q5gqwzISvGtbrSVxD8e7iZ6S6zx9ccKro@139.180.165.29:5432/postgres";
const p = new PrismaClient({ datasources: { db: { url: PROD } } });
// Raw SQL — independent of the (now-changed) Prisma models, casts enum to text.
const rows = await p.$queryRawUnsafe(`SELECT id, status::text AS status, client FROM "Engagement"`);
writeFileSync("_prodstatus.json", JSON.stringify(rows));
console.log(`captured ${rows.length}: ` + rows.map(r => `${r.client}=${r.status}`).join(", "));
await p.$disconnect();
