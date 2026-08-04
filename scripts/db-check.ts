import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not configured");

const parsed = new URL(connectionString);
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

try {
  const [database] = await prisma.$queryRaw<Array<{ database: string; user_name: string }>>`
    SELECT current_database() AS database, current_user AS user_name
  `;
  const [users, parents, teachers, students, groups, auditLogs] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "PARENT" } }),
    prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.student.count(),
    prisma.group.count(),
    prisma.auditLog.count(),
  ]);
  console.log(`Database: ${database.database}`);
  console.log(`Server: ${parsed.hostname}:${parsed.port || "5432"}; user: ${database.user_name}`);
  console.log({ users, parents, teachers, students, groups, auditLogs });
} catch (error) {
  console.error("Database check failed:", error instanceof Error ? error.message : "Unknown error");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
