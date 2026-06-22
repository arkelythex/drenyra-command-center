import { readdir, stat, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const DEFAULT_BACKUP_MAX_AGE_HOURS = 24;
const DEFAULT_BACKUP_DIR = fileURLToPath(
	new URL("../../../../../backups/postgres", import.meta.url),
);

type BackupSource = "manifest" | "filesystem" | "none";

/**
 * Backup readiness snapshot for PostgreSQL disaster-recovery checks.
 *
 * @example
 * ```ts
 * const backup: BackupReadinessStatus = await getBackupReadinessStatus();
 * ```
 */
export interface BackupReadinessStatus {
	status: "ok" | "warning" | "missing" | "error";
	backupDir: string;
	thresholdHours: number;
	lastBackupAt: string | null;
	lastBackupAgeHours: number | null;
	latestArtifact: string | null;
	source: BackupSource;
	error?: string;
}

interface BackupCandidate {
	timestampMs: number;
	artifactPath: string;
	source: Exclude<BackupSource, "none">;
}

interface BackupManifest {
	createdAt?: string;
	createdAtEpochMs?: number;
	filePath?: string;
}

/**
 * Evaluates whether a recent PostgreSQL backup artifact is available.
 *
 * @param now - Current timestamp in milliseconds used to compute backup age
 * @returns Backup readiness classification and artifact metadata
 * @example
 * ```ts
 * const readiness = await getBackupReadinessStatus(Date.now());
 * ```
 */
export async function getBackupReadinessStatus(
	now = Date.now(),
): Promise<BackupReadinessStatus> {
	const backupDir = resolveBackupDirectory();
	const thresholdHours = resolveBackupThresholdHours();

	try {
		const entries = await readdir(backupDir, { withFileTypes: true });
		const latestBackup =
			(await findLatestManifestCandidate(backupDir, entries)) ??
			(await findLatestDumpCandidate(backupDir, entries));

		if (!latestBackup) {
			return {
				status: "missing",
				backupDir,
				thresholdHours,
				lastBackupAt: null,
				lastBackupAgeHours: null,
				latestArtifact: null,
				source: "none",
			};
		}

		const ageHours = Math.max(
			0,
			Number(((now - latestBackup.timestampMs) / (1000 * 60 * 60)).toFixed(2)),
		);

		return {
			status: ageHours <= thresholdHours ? "ok" : "warning",
			backupDir,
			thresholdHours,
			lastBackupAt: new Date(latestBackup.timestampMs).toISOString(),
			lastBackupAgeHours: ageHours,
			latestArtifact: latestBackup.artifactPath,
			source: latestBackup.source,
		};
	} catch (error) {
		if (isNodeError(error) && error.code === "ENOENT") {
			return {
				status: "missing",
				backupDir,
				thresholdHours,
				lastBackupAt: null,
				lastBackupAgeHours: null,
				latestArtifact: null,
				source: "none",
			};
		}

		return {
			status: "error",
			backupDir,
			thresholdHours,
			lastBackupAt: null,
			lastBackupAgeHours: null,
			latestArtifact: null,
			source: "none",
			error:
				error instanceof Error
					? error.message
					: "Unable to inspect backup directory",
		};
	}
}

function resolveBackupDirectory(): string {
	const configured = process.env.ARKELYTHEX_BACKUP_DIR?.trim();
	return configured && configured.length > 0 ? configured : DEFAULT_BACKUP_DIR;
}

function resolveBackupThresholdHours(): number {
	const rawValue = process.env.ARKELYTHEX_BACKUP_MAX_AGE_HOURS?.trim();
	if (!rawValue) {
		return DEFAULT_BACKUP_MAX_AGE_HOURS;
	}

	const parsed = Number.parseInt(rawValue, 10);
	return Number.isFinite(parsed) && parsed > 0
		? parsed
		: DEFAULT_BACKUP_MAX_AGE_HOURS;
}

async function findLatestManifestCandidate(
	backupDir: string,
	entries: Array<{ name: string; isFile(): boolean }>,
): Promise<BackupCandidate | null> {
	const manifestCandidates: BackupCandidate[] = [];

	for (const entry of entries) {
		if (!entry.isFile() || !entry.name.endsWith(".json")) {
			continue;
		}

		const manifestPath = `${backupDir}/${entry.name}`;
		const manifest = await readManifestFile(manifestPath);
		if (!manifest) {
			continue;
		}

		const timestampMs = resolveManifestTimestamp(manifest);
		if (!timestampMs) {
			continue;
		}

		manifestCandidates.push({
			timestampMs,
			artifactPath: manifest.filePath ?? manifestPath,
			source: "manifest",
		});
	}

	return pickLatestCandidate(manifestCandidates);
}

async function findLatestDumpCandidate(
	backupDir: string,
	entries: Array<{ name: string; isFile(): boolean }>,
): Promise<BackupCandidate | null> {
	const dumpCandidates = await Promise.all(
		entries
			.filter((entry) => entry.isFile() && entry.name.endsWith(".dump"))
			.map(async (entry) => {
				const artifactPath = `${backupDir}/${entry.name}`;
				const fileStat = await stat(artifactPath);

				return {
					timestampMs: fileStat.mtimeMs,
					artifactPath,
					source: "filesystem" as const,
				};
			}),
	);

	return pickLatestCandidate(dumpCandidates);
}

async function readManifestFile(
	manifestPath: string,
): Promise<BackupManifest | null> {
	try {
		const content = await readFile(manifestPath, "utf8");
		const parsed = JSON.parse(content);
		return isRecord(parsed) ? (parsed as BackupManifest) : null;
	} catch {
		return null;
	}
}

function resolveManifestTimestamp(manifest: BackupManifest): number | null {
	if (
		typeof manifest.createdAtEpochMs === "number" &&
		Number.isFinite(manifest.createdAtEpochMs)
	) {
		return manifest.createdAtEpochMs;
	}

	if (typeof manifest.createdAt === "string") {
		const parsed = Date.parse(manifest.createdAt);
		if (Number.isFinite(parsed)) {
			return parsed;
		}
	}

	return null;
}

function pickLatestCandidate<T extends BackupCandidate>(
	candidates: T[],
): T | null {
	if (candidates.length === 0) {
		return null;
	}

	return candidates.reduce((latest, current) =>
		current.timestampMs > latest.timestampMs ? current : latest,
	);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
	return error instanceof Error;
}
