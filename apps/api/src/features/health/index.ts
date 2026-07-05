import { db } from "@drenyra/persistence/client";
import { sql } from "@drenyra/persistence/query";
import { Elysia } from "elysia";
import { logger } from "../../lib/logger";
import { getTaxationEventBootstrapStatus } from "../taxation/application/handlers/bootstrap-taxation-event-subscriptions";
import { checkDoctor } from "./application/queries/check-doctor";
import { checkReady } from "./application/queries/check-ready";
import { checkStartup } from "./application/queries/check-startup";
import {
	type BackupReadinessStatus,
	getBackupReadinessStatus,
} from "./backup-readiness";
import {
	getOpenTelemetryReadinessStatus,
	type OpenTelemetryReadiness,
} from "./otel-readiness";
import {
	getRlsReadinessStatus,
	type RlsReadinessStatus,
} from "./rls-readiness";

type DbExecute = typeof db.execute;
type LoggerInfo = typeof logger.info;
type TaxationBootstrapStatus = ReturnType<
	typeof getTaxationEventBootstrapStatus
>;

interface HealthModuleDeps {
	dbExecute?: DbExecute;
	loggerInfo?: LoggerInfo;
	getBackupReadinessStatus?: () => Promise<BackupReadinessStatus>;
	getOpenTelemetryReadinessStatus?: () => OpenTelemetryReadiness;
	getRlsReadinessStatus?: () => Promise<RlsReadinessStatus>;
	getTaxationEventBootstrapStatus?: () => TaxationBootstrapStatus;
	fetchFn?: typeof fetch;
}

/**
 * Builds health routes with injectable dependencies for tests and runtime checks.
 *
 * @param deps - Optional health dependency overrides
 * @returns Elysia module exposing `/health/live`, `/health/ready`, `/health/doctor`, and `/health/startup`
 * @example
 * ```ts
 * const health = buildHealthModule();
 * app.use(health);
 * ```
 */
export function buildHealthModule(deps: HealthModuleDeps = {}) {
	const dbExecute = deps.dbExecute ?? db.execute.bind(db);
	const loggerInfo = deps.loggerInfo ?? logger.info.bind(logger);
	const readBackupReadiness =
		deps.getBackupReadinessStatus ?? getBackupReadinessStatus;
	const readOpenTelemetryReadiness =
		deps.getOpenTelemetryReadinessStatus ?? getOpenTelemetryReadinessStatus;
	const readRlsReadiness = deps.getRlsReadinessStatus ?? getRlsReadinessStatus;
	const readTaxationBootstrapStatus =
		deps.getTaxationEventBootstrapStatus ?? getTaxationEventBootstrapStatus;
	const fetchFn = deps.fetchFn ?? fetch;

	return new Elysia({ prefix: "/health" })
		.get("/live", () => ({
			status: "ok",
			timestamp: new Date().toISOString(),
			uptime: process.uptime(),
			service: "drenyra-api",
			version: "2.0.0",
		}))
		.get("/ready", async ({ set }) => {
			const result = await checkReady({ dbExecute, loggerInfo, fetchFn });

			if (result.status === "degraded") {
				set.status = 503;
			}

			return result;
		})
		.get("/doctor", async ({ set }) => {
			const result = await checkDoctor({
				dbExecute,
				loggerInfo,
				readBackupReadiness,
				readOpenTelemetryReadiness,
				readRlsReadiness,
				readTaxationBootstrapStatus,
			});

			if (result.status !== "ok") {
				set.status = 503;
			}

			return result;
		})
		.get("/startup", async ({ set }) => {
			const result = await checkStartup({
				dbExecute,
				readTaxationBootstrapStatus,
			});

			if (result.status === "starting") {
				set.status = 503;
			}

			return result;
		});
}

/**
 * Default health module bound to production dependencies.
 *
 * @example
 * ```ts
 * app.use(healthModule);
 * ```
 */
export const healthModule = buildHealthModule();
