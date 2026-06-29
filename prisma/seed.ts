import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

// Keep in step with DEFAULT_RATE_CARDS in src/lib/constants.ts (inlined here so the
// seed has no path-alias dependency under tsx).
const RATE_CARDS = [
  { role: "Partner",                       hourlyCost: 307.02, chargeRate: 700.0, sortOrder: 1 },
  { role: "Associate Partner",             hourlyCost: 181.87, chargeRate: 440.0, sortOrder: 2 },
  { role: "Principal",                     hourlyCost: 140.94, chargeRate: 290.0, sortOrder: 3 },
  { role: "Associate Director",            hourlyCost: 146.78, chargeRate: 350.0, sortOrder: 4 },
  { role: "Recruitment Manager",           hourlyCost: 140.94, chargeRate: 290.0, sortOrder: 5 },
  { role: "Senior Recruitment Consultant", hourlyCost: 129.24, chargeRate: 210.0, sortOrder: 6 },
  { role: "Recruitment Consultant",        hourlyCost: 123.39, chargeRate: 160.0, sortOrder: 7 },
  { role: "Admin",                         hourlyCost: 123.39, chargeRate: 160.0, sortOrder: 8 },
];

// Keep in step with SERVICES in src/lib/constants.ts.
const SERVICES = [
  "Executive Search",
  "Success Profile",
  "Board Performance Review — Light",
  "Board Performance Review — Standard",
  "Board Performance Review — Comprehensive",
  "Board Skills Matrix",
  "Remuneration Benchmarking — Tier 1",
  "Remuneration Benchmarking — Tier 2",
  "Other",
];

async function main() {
  console.log("Seeding rate cards…");
  for (const rc of RATE_CARDS) {
    await prisma.rateCard.upsert({
      where: { role: rc.role },
      update: { hourlyCost: rc.hourlyCost, chargeRate: rc.chargeRate, sortOrder: rc.sortOrder, active: true },
      create: rc,
    });
  }

  console.log("Seeding engagement types…");
  for (let i = 0; i < SERVICES.length; i++) {
    await prisma.service.upsert({
      where: { name: SERVICES[i] },
      update: { sortOrder: i + 1 },
      create: { name: SERVICES[i], sortOrder: i + 1 },
    });
  }

  console.log("Seeding statuses…");
  const STATUSES = [
    { name: "Enquiry",   color: "outline",    sortOrder: 1, isDefault: true },
    { name: "Active",    color: "green",      sortOrder: 2, isDefault: false },
    { name: "Completed", color: "teal",       sortOrder: 3, isDefault: false },
    { name: "On hold",   color: "apricot",    sortOrder: 4, isDefault: false },
    { name: "Declined",  color: "terracotta", sortOrder: 5, isDefault: false },
  ];
  for (const st of STATUSES) {
    await prisma.status.upsert({
      where: { name: st.name },
      update: { color: st.color, sortOrder: st.sortOrder, isDefault: st.isDefault, active: true },
      create: st,
    });
  }

  const partner = await prisma.rateCard.findUnique({ where: { role: "Partner" } });
  const srConsultant = await prisma.rateCard.findUnique({ where: { role: "Senior Recruitment Consultant" } });

  // Primary login user — change this password after first sign-in.
  const adminPw = await bcrypt.hash("ChangeMe123!", 12);
  await prisma.user.upsert({
    where: { email: "adam@orchardtalent.com.au" },
    update: { name: "Adam Dent", roleId: partner?.id, canManage: true, active: true },
    create: {
      name: "Adam Dent",
      email: "adam@orchardtalent.com.au",
      password: adminPw,
      roleId: partner?.id,
      canManage: true,
    },
  });

  // Other consultants — no login until a password is set; random placeholder for now.
  const others = [
    { name: "Alex McDonald",        email: "alex.mcdonald@orchardtalent.com.au",     roleId: partner?.id },
    { name: "Nick Greval-Kendall",  email: "nick.greval-kendall@orchardtalent.com.au", roleId: srConsultant?.id },
  ];
  for (const c of others) {
    const pw = await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 12);
    await prisma.user.upsert({
      where: { email: c.email },
      update: { name: c.name, roleId: c.roleId, active: true },
      create: { name: c.name, email: c.email, password: pw, roleId: c.roleId },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
