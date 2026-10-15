import { seedTestUsers } from "./seed-test-users";

export default async function globalSetup() {
  await seedTestUsers();
}
