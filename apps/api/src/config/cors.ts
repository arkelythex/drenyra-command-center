const DEV_ORIGIN_DEFAULTS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
];

export function resolveCorsOrigins(
  env: Record<string, string | undefined> = process.env
): string[] {
  const configured =
    (env.CORS_ALLOWED_ORIGINS ?? '').trim() || (env.ALLOWED_ORIGINS ?? '').trim();
  const raw = configured;
  if (raw.length > 0) {
    const parsed = raw
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
    return Array.from(new Set(parsed));
  }

  const nodeEnv = (env.NODE_ENV ?? 'development').toLowerCase();
  if (nodeEnv !== 'production') {
    return DEV_ORIGIN_DEFAULTS;
  }

  return [];
}
