import { z } from "zod";
export declare const EnvSchema: z.ZodObject<
	{
		NODE_ENV: z.ZodDefault<
			z.ZodEnum<{
				test: "test";
				production: "production";
				development: "development";
			}>
		>;
		PORT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
		LOG_LEVEL: z.ZodDefault<
			z.ZodEnum<{
				info: "info";
				error: "error";
				warn: "warn";
				debug: "debug";
			}>
		>;
		CORS_ALLOWED_ORIGINS: z.ZodOptional<z.ZodString>;
		DATABASE_URL: z.ZodOptional<z.ZodString>;
		REDIS_URL: z.ZodOptional<z.ZodString>;
		BETTER_AUTH_SECRET: z.ZodOptional<z.ZodString>;
		BETTER_AUTH_URL: z.ZodOptional<z.ZodString>;
		JWT_SECRET: z.ZodOptional<z.ZodString>;
		JWT_EXPIRES_IN: z.ZodDefault<z.ZodString>;
		OPENAI_API_KEY: z.ZodOptional<z.ZodString>;
		ANTHROPIC_API_KEY: z.ZodOptional<z.ZodString>;
		GOOGLE_AI_API_KEY: z.ZodOptional<z.ZodString>;
		XAI_API_KEY: z.ZodOptional<z.ZodString>;
		OPENROUTER_API_KEY: z.ZodOptional<z.ZodString>;
		OPENROUTER_BASE_URL: z.ZodOptional<z.ZodString>;
		OPENROUTER_DEFAULT_MODEL: z.ZodOptional<z.ZodString>;
		AI_MODEL: z.ZodDefault<z.ZodString>;
		SUNAT_API_URL: z.ZodOptional<z.ZodString>;
		SUNAT_API_TIMEOUT_MS: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
		SUNAT_RUC: z.ZodOptional<z.ZodString>;
		SUNAT_CPE_VALIDATION_MODE: z.ZodDefault<
			z.ZodEnum<{
				sandbox: "sandbox";
				replay: "replay";
				real: "real";
			}>
		>;
		SUNAT_CPE_API_TOKEN: z.ZodOptional<z.ZodString>;
		OSE_PROVIDER: z.ZodDefault<
			z.ZodEnum<{
				custom: "custom";
				simulation: "simulation";
				nubefact: "nubefact";
				bizlinks: "bizlinks";
			}>
		>;
		OSE_ENV: z.ZodDefault<
			z.ZodEnum<{
				sandbox: "sandbox";
				production: "production";
			}>
		>;
		OSE_API_URL: z.ZodOptional<z.ZodString>;
		OSE_API_TOKEN: z.ZodOptional<z.ZodString>;
		SIRE_JWT_SECRET: z.ZodOptional<z.ZodString>;
		SIRE_RATE_LIMIT_MAX_REQUESTS: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
		SIRE_RATE_LIMIT_WINDOW_MINUTES: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
		SMTP_HOST: z.ZodOptional<z.ZodString>;
		SMTP_PORT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
		SMTP_SECURE: z.ZodDefault<z.ZodCoercedBoolean<unknown>>;
		SMTP_USER: z.ZodOptional<z.ZodString>;
		SMTP_PASS: z.ZodOptional<z.ZodString>;
		SMTP_FROM_NAME: z.ZodDefault<z.ZodString>;
		SMTP_FROM_EMAIL: z.ZodOptional<z.ZodString>;
		STORAGE_PROVIDER: z.ZodDefault<
			z.ZodEnum<{
				r2: "r2";
				s3: "s3";
				minio: "minio";
			}>
		>;
		R2_ENDPOINT: z.ZodOptional<z.ZodString>;
		R2_ACCESS_KEY_ID: z.ZodOptional<z.ZodString>;
		R2_SECRET_ACCESS_KEY: z.ZodOptional<z.ZodString>;
		R2_BUCKET_NAME: z.ZodDefault<z.ZodString>;
		ENABLE_AI_AGENTS: z.ZodDefault<z.ZodCoercedBoolean<unknown>>;
		ENABLE_SUNAT_SYNC: z.ZodDefault<z.ZodCoercedBoolean<unknown>>;
		LEDGER_MVP_ENABLED: z.ZodDefault<z.ZodCoercedBoolean<unknown>>;
		FRONTEND_TELEMETRY_DB_ENABLED: z.ZodDefault<z.ZodCoercedBoolean<unknown>>;
	},
	z.core.$strip
>;
export type Env = z.infer<typeof EnvSchema>;
export declare function validateEnv(env?: Record<string, unknown>): Env;
//# sourceMappingURL=env-schema.d.ts.map
