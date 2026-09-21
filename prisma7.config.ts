import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // CLI operations (migrate, introspect) use the unpooled Neon endpoint;
    // the runtime client connects through pooled DATABASE_URL via PrismaPg.
    url: process.env["DATABASE_URL_UNPOOLED"],
  },
});
