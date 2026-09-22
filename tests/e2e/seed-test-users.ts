import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import { PrismaClient } from "@prisma/client";

const scrypt = promisify(scryptCallback);
const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

export async function seedTestUsers() {
  const customerEmail = "test_customer@buildora.in";
  const adminEmail = "test_admin@buildora.in";
  const password = "Password123!";
  const passwordHash = await hashPassword(password);

  // 1. Upsert test customer
  const customer = await prisma.user.upsert({
    where: { normalizedEmail: customerEmail },
    update: { passwordHash, accountStatus: "active", role: "customer" },
    create: {
      name: "Aarav Customer",
      email: customerEmail,
      normalizedEmail: customerEmail,
      phone: "+91 98765 43210",
      passwordHash,
      role: "customer",
      accountStatus: "active",
    },
  });

  // 2. Upsert test admin
  await prisma.user.upsert({
    where: { normalizedEmail: adminEmail },
    update: { passwordHash, accountStatus: "active", role: "admin" },
    create: {
      name: "Buildora Administrator",
      email: adminEmail,
      normalizedEmail: adminEmail,
      phone: "+91 99999 00000",
      passwordHash,
      role: "admin",
      accountStatus: "active",
    },
  });

  // 3. Upsert a project for the test customer
  const projectId = "11111111-1111-1111-1111-111111111111";
  await prisma.project.upsert({
    where: { id: projectId },
    update: { customerId: customer.id },
    create: {
      id: projectId,
      customerId: customer.id,
      name: "Residence 01",
      slug: "residence-01-test",
      location: "Worli, Mumbai",
      status: "in_progress",
      progress: 68,
      phases: {
        create: [
          { name: "Planning & Design", status: "completed", progress: 100, sortOrder: 1 },
          { name: "Structural Foundation", status: "active", progress: 68, sortOrder: 2 },
        ],
      },
      milestones: {
        create: [
          { name: "Plinth Beam Signoff", status: "in_progress", sortOrder: 1 },
        ],
      },
    },
  });

  console.log("E2E Test Users & Project seeded successfully.");
}

// Run directly if invoked from CLI
if (process.argv[1]?.includes("seed-test-users")) {
  seedTestUsers()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seed failed:", err);
      process.exit(1);
    });
}
