import "dotenv/config";
import { defineConfig } from "prisma/config";

const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // Client generation and static checks do not need a live database URL.
  // Migration and introspection commands still receive the configured URL
  // whenever DIRECT_URL or DATABASE_URL is present.
  ...(databaseUrl ? { datasource: { url: databaseUrl } } : {}),
});
