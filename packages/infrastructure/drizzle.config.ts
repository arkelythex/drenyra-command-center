import { defineConfig } from 'drizzle-kit';

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (url && !url.startsWith('$')) return url;
  throw new Error(
    'DATABASE_URL is required for Drizzle. Set it in the environment (or root .env) before running db:push.'
  );
}

const DATABASE_URL = requireDatabaseUrl();

export default defineConfig({
  schema: '../persistence/src/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: DATABASE_URL,
  },
});
