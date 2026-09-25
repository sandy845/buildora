/**
 * Firebase Firestore Seeder
 * Populates Firestore with initial services, default admin/customer users, and sample projects.
 * Run with: npm run firebase:seed or npx tsx src/lib/firebase/seed.ts
 */

import { firestoreCreate, firestoreFindOne } from "./firestore";
import { services } from "../../data/services";
import { projects } from "../../data/projects";

export async function seedFirestore() {
  console.log("🚀 Starting Firebase Firestore seed...");

  // 1. Seed Services
  console.log("📦 Seeding services...");
  for (const s of services) {
    const existing = await firestoreFindOne("services", {
      where: [{ field: "slug", operator: "==", value: s.slug }],
    });

    if (!existing) {
      await firestoreCreate("services", {
        slug: s.slug,
        name: s.title,
        shortDescription: s.shortDescription,
        description: s.description,
        highlights: s.highlights || [],
        include: s.include || [],
        active: true,
      });
      console.log(`  + Created service: ${s.title}`);
    } else {
      console.log(`  = Service already exists: ${s.title}`);
    }
  }

  // 2. Seed Portfolio Projects
  console.log("🏗️ Seeding portfolio projects...");
  for (const p of projects) {
    const existing = await firestoreFindOne("portfolioProjects", {
      where: [{ field: "slug", operator: "==", value: p.slug }],
    });

    if (!existing) {
      await firestoreCreate("portfolioProjects", {
        slug: p.slug,
        title: p.name,
        name: p.name,
        category: p.category,
        location: p.location,
        description: p.overview,
        gallery: p.gallery.map((url) => ({ url })),
        featured: true,
      });
      console.log(`  + Created portfolio project: ${p.name}`);
    } else {
      console.log(`  = Portfolio project already exists: ${p.name}`);
    }
  }

  // 3. Seed Default Admin User
  console.log("👤 Seeding default admin user...");
  const adminEmail = "admin@buildora.in";
  const existingAdmin = await firestoreFindOne("users", {
    where: [{ field: "normalizedEmail", operator: "==", value: adminEmail }],
  });

  if (!existingAdmin) {
    await firestoreCreate("users", {
      id: "admin-default-id",
      name: "Buildora Admin",
      email: adminEmail,
      normalizedEmail: adminEmail,
      phone: "+91 99999 00000",
      role: "admin",
      accountStatus: "active",
      emailVerifiedAt: new Date().toISOString(),
    });
    console.log(`  + Created default admin user: ${adminEmail}`);
  } else {
    console.log(`  = Admin user already exists: ${adminEmail}`);
  }

  console.log("✅ Firestore seeding completed successfully!");
}

// Auto-run if executed directly
if (process.argv[1]?.includes("seed")) {
  seedFirestore()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seed failed:", err);
      process.exit(1);
    });
}
