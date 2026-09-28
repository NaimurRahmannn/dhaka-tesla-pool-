import path from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

import { PrismaClient, UserRole, VehicleStatus } from "../src/generated/prisma/client.js";

const prismaRoot = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(prismaRoot, "../../.env") });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed the database");
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });
const developmentPasswordHash =
  "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

const users = [
  { id: "00000000-0000-4000-8000-000000000001", name: "Jashim", email: "jashim@tesla-pool.local", role: UserRole.DRIVER },
  { id: "00000000-0000-4000-8000-000000000002", name: "Nusrat", email: "nusrat@tesla-pool.local", role: UserRole.PASSENGER },
  { id: "00000000-0000-4000-8000-000000000003", name: "Rafiq", email: "rafiq@tesla-pool.local", role: UserRole.PASSENGER },
  { id: "00000000-0000-4000-8000-000000000004", name: "Shirin", email: "shirin@tesla-pool.local", role: UserRole.PASSENGER },
] as const;

async function main() {
  const jashim = await prisma.user.upsert({
    where: { email: users[0].email },
    update: { name: users[0].name, role: users[0].role, passwordHash: developmentPasswordHash },
    create: { ...users[0], passwordHash: developmentPasswordHash },
  });

  await prisma.vehicle.upsert({
    where: { id: "00000000-0000-4000-8000-000000000010" },
    update: { driverId: jashim.id, name: "Bullet", capacity: 3, status: VehicleStatus.OFFLINE },
    create: { id: "00000000-0000-4000-8000-000000000010", driverId: jashim.id, name: "Bullet", capacity: 3, status: VehicleStatus.OFFLINE },
  });

  for (const user of users.slice(1)) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, role: user.role, passwordHash: developmentPasswordHash },
      create: { ...user, passwordHash: developmentPasswordHash },
    });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
