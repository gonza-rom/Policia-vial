import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // El CLI (migrate/db push/generate) usa la conexión directa (sin pgbouncer):
  // el pooler transaccional de Supabase (puerto 6543) no soporta los
  // prepared statements que necesita el schema engine. El runtime de la app
  // (src/lib/prisma.ts) sigue usando DATABASE_URL (pooled) por separado.
  datasource: {
    url: env("DIRECT_URL"),
  },
});
