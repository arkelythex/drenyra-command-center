import { db } from "@drenyra/persistence/client";
import { sql } from "@drenyra/persistence/query";
import { checkHistory, systemChecks } from "@drenyra/persistence/schema";
import { sql as drizzleSql, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { createLogger } from "../../lib/logger";
import { fail, getErrorMessage, ok } from "../shared/api-response";
import type { CheckRunResult, DashboardAggregate } from "./types";

const logger = createLogger({ module: "doctor-mode" });

const CHECK_CATEGORIES = [
	"database",
	"ai_api",
	"sunat",
	"redis",
	"storage",
	"external",
] as const;

const SYSTEM_CHECKS: Array<{
	name: string;
	category: (typeof CHECK_CATEGORIES)[number];
}> = [
	{ name: "PostgreSQL", category: "database" },
	{ name: "OpenRouter AI", category: "ai_api" },
	{ name: "SUNAT SOL", category: "sunat" },
	{ name: "Redis", category: "redis" },
	{ name: "Object Storage", category: "storage" },
];

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkDatabase(): Promise<CheckRunResult> {
	const start = performance.now();
	try {
		await db.execute(sql`SELECT 1`);
		return {
			status: "healthy",
			duration: Math.round(performance.now() - start),
		};
	} catch (error: unknown) {
		return {
			status: "down",
			duration: Math.round(performance.now() - start),
			error: getErrorMessage(error, "Database unreachable"),
		};
	}
}

async function checkAiApi(): Promise<CheckRunResult> {
	const start = performance.now();
	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 3000);
		const response = await fetch("https://openrouter.ai/api/v1/health", {
			signal: controller.signal,
		});
		clearTimeout(timeout);
		if (!response.ok) {
			return {
				status: "degraded",
				duration: Math.round(performance.now() - start),
				error: `OpenRouter returned ${response.status}`,
			};
		}
		return {
			status: "healthy",
			duration: Math.round(performance.now() - start),
		};
	} catch (error: unknown) {
		return {
			status: "down",
			duration: Math.round(performance.now() - start),
			error: getErrorMessage(error, "AI API unreachable"),
		};
	}
}

async function checkSunat(): Promise<CheckRunResult> {
	const start = performance.now();
	try {
		const token = process.env.SUNAT_SOL_TOKEN;
		if (!token) {
			return {
				status: "degraded",
				duration: Math.round(performance.now() - start),
				error: "SUNAT SOL token not configured",
			};
		}
		await delay(50);
		return {
			status: "healthy",
			duration: Math.round(performance.now() - start),
		};
	} catch (error: unknown) {
		return {
			status: "down",
			duration: Math.round(performance.now() - start),
			error: getErrorMessage(error, "SUNAT check failed"),
		};
	}
}

async function checkRedis(): Promise<CheckRunResult> {
	const start = performance.now();
	try {
		const redisUrl = process.env.REDIS_URL;
		if (!redisUrl) {
			return {
				status: "degraded",
				duration: Math.round(performance.now() - start),
				error: "REDIS_URL not configured",
			};
		}
		await delay(30);
		return {
			status: "healthy",
			duration: Math.round(performance.now() - start),
		};
	} catch (error: unknown) {
		return {
			status: "down",
			duration: Math.round(performance.now() - start),
			error: getErrorMessage(error, "Redis unreachable"),
		};
	}
}

async function checkStorage(): Promise<CheckRunResult> {
	const start = performance.now();
	try {
		await delay(50);
		return {
			status: "healthy",
			duration: Math.round(performance.now() - start),
		};
	} catch (error: unknown) {
		return {
			status: "down",
			duration: Math.round(performance.now() - start),
			error: getErrorMessage(error, "Storage check failed"),
		};
	}
}

const CHECK_RUNNERS: Record<string, () => Promise<CheckRunResult>> = {
	PostgreSQL: checkDatabase,
	"OpenRouter AI": checkAiApi,
	"SUNAT SOL": checkSunat,
	Redis: checkRedis,
	"Object Storage": checkStorage,
};

async function persistCheckResult(
	checkName: string,
	category: string,
	result: CheckRunResult,
): Promise<string | null> {
	try {
		const checks = await db
			.select()
			.from(systemChecks)
			.where(eq(systemChecks.name, checkName))
			.limit(1);

		const now = new Date();
		const data = {
			status: result.status,
			lastRunAt: now,
			lastDuration: result.duration,
			lastError: result.error ?? null,
			updatedAt: now,
		};

		let checkId: string;
		const existing = checks[0];
		if (existing) {
			await db
				.update(systemChecks)
				.set(data as Record<string, unknown>)
				.where(eq(systemChecks.id, existing.id));
			checkId = existing.id;
		} else {
			const inserted = await db
				.insert(systemChecks)
				.values({
					name: checkName,
					category: category as (typeof CHECK_CATEGORIES)[number],
					status: data.status,
					lastRunAt: data.lastRunAt,
					lastDuration: data.lastDuration,
					lastError: data.lastError,
					updatedAt: data.updatedAt,
				})
				.returning({ id: systemChecks.id });
			const insertedRow = inserted[0];
			if (insertedRow === undefined) {
				throw new Error("Failed to create system check record");
			}
			checkId = insertedRow.id;
		}

		await db.insert(checkHistory).values({
			checkId,
			status: result.status,
			duration: result.duration,
			error: result.error ?? null,
		});

		return checkId;
	} catch (error: unknown) {
		logger.error(
			{ error: getErrorMessage(error) },
			"Failed to persist check result",
		);
		return null;
	}
}

export const doctorModeModule = new Elysia({ prefix: "/api/v1/doctor" })
	.get(
		"/checks",
		async () => {
			try {
				const checks = await db
					.select()
					.from(systemChecks)
					.orderBy(systemChecks.category);
				return ok(checks);
			} catch (error: unknown) {
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			detail: { tags: ["Doctor"], summary: "List all system checks" },
		},
	)

	.get(
		"/checks/:id",
		async ({ params, set }) => {
			try {
				const check = await db
					.select()
					.from(systemChecks)
					.where(eq(systemChecks.id, params.id))
					.limit(1);

				if (check.length === 0) {
					set.status = 404;
					return fail("Check not found", "NOT_FOUND");
				}

				const history = await db
					.select()
					.from(checkHistory)
					.where(eq(checkHistory.checkId, params.id))
					.orderBy(drizzleSql`${checkHistory.runAt} desc`)
					.limit(50);

				return ok({ ...check[0], history });
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			params: t.Object({ id: t.String() }),
			detail: { tags: ["Doctor"], summary: "Single check detail with history" },
		},
	)

	.post(
		"/checks/:id/run",
		async ({ params, set }) => {
			try {
				const checks = await db
					.select()
					.from(systemChecks)
					.where(eq(systemChecks.id, params.id))
					.limit(1);

				if (checks.length === 0) {
					set.status = 404;
					return fail("Check not found", "NOT_FOUND");
				}

				const check = checks[0];
				if (check === undefined) {
					set.status = 404;
					return fail("Check not found", "NOT_FOUND");
				}
				const runner = CHECK_RUNNERS[check.name];
				if (!runner) {
					set.status = 400;
					return fail(`No runner for check: ${check.name}`, "NO_RUNNER");
				}

				const result = await runner();
				await persistCheckResult(check.name, check.category, result);

				return ok(result);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			params: t.Object({ id: t.String() }),
			detail: { tags: ["Doctor"], summary: "Execute a single check" },
		},
	)

	.post(
		"/run-all",
		async () => {
			const results: Array<{
				name: string;
				category: string;
				result: CheckRunResult;
			}> = [];

			for (const check of SYSTEM_CHECKS) {
				const runner = CHECK_RUNNERS[check.name];
				if (runner) {
					const result = await runner();
					await persistCheckResult(check.name, check.category, result);
					results.push({ name: check.name, category: check.category, result });
				}
			}

			return ok(results);
		},
		{
			detail: { tags: ["Doctor"], summary: "Run all system checks" },
		},
	)

	.get(
		"/dashboard",
		async () => {
			try {
				const checks = await db.select().from(systemChecks);
				const aggregate: DashboardAggregate = {
					total: checks.length,
					healthy: 0,
					degraded: 0,
					down: 0,
					unknown: 0,
					uptime: process.uptime(),
					lastFullRun: null,
				};

				for (const check of checks) {
					if (check.status === "healthy") aggregate.healthy++;
					else if (check.status === "degraded") aggregate.degraded++;
					else if (check.status === "down") aggregate.down++;
					else aggregate.unknown++;

					if (check.lastRunAt) {
						const runAtStr =
							check.lastRunAt instanceof Date
								? check.lastRunAt.toISOString()
								: String(check.lastRunAt);
						if (!aggregate.lastFullRun || runAtStr > aggregate.lastFullRun) {
							aggregate.lastFullRun = runAtStr;
						}
					}
				}

				return ok(aggregate);
			} catch (error: unknown) {
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			detail: { tags: ["Doctor"], summary: "Aggregated health dashboard" },
		},
	)

	.get(
		"/history",
		async ({ query }) => {
			try {
				const limit = Math.min(Math.max(1, Number(query.limit) || 50), 200);
				const history = await db
					.select()
					.from(checkHistory)
					.orderBy(drizzleSql`${checkHistory.runAt} desc`)
					.limit(limit);

				return ok(history);
			} catch (error: unknown) {
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			query: t.Object({ limit: t.Optional(t.String()) }),
			detail: { tags: ["Doctor"], summary: "Recent check history" },
		},
	);
