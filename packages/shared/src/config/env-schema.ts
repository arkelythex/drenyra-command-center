import { z } from "zod";

export const EnvSchema = z.object({
	// ── Server ──────────────────────────────────────
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.default("development"),
	PORT: z.coerce.number().default(3000),
	LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
	CORS_ALLOWED_ORIGINS: z.string().optional(),

	// ── Database ────────────────────────────────────
	DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL").optional(),
	REDIS_URL: z.string().optional(),

	// ── Auth ────────────────────────────────────────
	BETTER_AUTH_SECRET: z
		.string()
		.min(32, "BETTER_AUTH_SECRET must be at least 32 characters")
		.optional(),
	BETTER_AUTH_URL: z.string().url().optional(),
	JWT_SECRET: z.string().min(32).optional(),
	JWT_EXPIRES_IN: z.string().default("7d"),

	// ── AI Providers ────────────────────────────────
	OPENAI_API_KEY: z.string().optional(),
	ANTHROPIC_API_KEY: z.string().optional(),
	GOOGLE_AI_API_KEY: z.string().optional(),
	XAI_API_KEY: z.string().optional(),
	OPENROUTER_API_KEY: z.string().optional(),
	OPENROUTER_BASE_URL: z.string().url().optional(),
	OPENROUTER_DEFAULT_MODEL: z.string().optional(),
	AI_MODEL: z.string().default("gpt-4o"),

	// ── SUNAT / Fiscal ──────────────────────────────
	SUNAT_API_URL: z.string().url().optional(),
	SUNAT_API_TIMEOUT_MS: z.coerce.number().default(4500),
	SUNAT_RUC: z.string().length(11).optional(),
	SUNAT_CPE_VALIDATION_MODE: z
		.enum(["sandbox", "replay", "real"])
		.default("sandbox"),
	SUNAT_CPE_API_TOKEN: z.string().optional(),
	OSE_PROVIDER: z
		.enum(["nubefact", "bizlinks", "custom", "simulation"])
		.default("simulation"),
	OSE_ENV: z.enum(["sandbox", "production"]).default("sandbox"),
	OSE_API_URL: z.string().url().optional(),
	OSE_API_TOKEN: z.string().optional(),
	SIRE_JWT_SECRET: z.string().optional(),
	SIRE_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(10),
	SIRE_RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().default(1),

	// ── SMTP ────────────────────────────────────────
	SMTP_HOST: z.string().optional(),
	SMTP_PORT: z.coerce.number().default(587),
	SMTP_SECURE: z.coerce.boolean().default(false),
	SMTP_USER: z.string().optional(),
	SMTP_PASS: z.string().optional(),
	SMTP_FROM_NAME: z.string().default("DRENYRA"),
	SMTP_FROM_EMAIL: z.string().email().optional(),

	// ── Storage ─────────────────────────────────────
	STORAGE_PROVIDER: z.enum(["r2", "minio", "s3"]).default("r2"),
	R2_ENDPOINT: z.string().optional(),
	R2_ACCESS_KEY_ID: z.string().optional(),
	R2_SECRET_ACCESS_KEY: z.string().optional(),
	R2_BUCKET_NAME: z.string().default("drenyra-documents"),

	// ── Feature Flags ───────────────────────────────
	ENABLE_AI_AGENTS: z.coerce.boolean().default(true),
	ENABLE_SUNAT_SYNC: z.coerce.boolean().default(false),
	LEDGER_MVP_ENABLED: z.coerce.boolean().default(true),
	FRONTEND_TELEMETRY_DB_ENABLED: z.coerce.boolean().default(true),
});

export type Env = z.infer<typeof EnvSchema>;

export function validateEnv(env: Record<string, unknown> = process.env): Env {
	const result = EnvSchema.safeParse(env);

	if (!result.success) {
		const isProduction = env.NODE_ENV === "production";
		for (const issue of result.error.issues) {
			const path = issue.path.join(".");
			const msg = `[ENV] ${path}: ${issue.message}`;
			if (isProduction) {
				console.error(msg);
			} else {
				console.warn(msg);
			}
		}
		if (isProduction) process.exit(1);
	}

	return result.data ?? (EnvSchema.parse({}) as Env);
}
