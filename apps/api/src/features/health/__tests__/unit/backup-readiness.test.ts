import { mkdtemp, rm, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { getBackupReadinessStatus } from "../../backup-readiness.ts";

const originalEnv = { ...process.env };
const tempDirs: string[] = [];

afterEach(async () => {
	process.env = { ...originalEnv };

	for (const directory of tempDirs.splice(0)) {
		await rm(directory, { recursive: true, force: true });
	}
});

describe("getBackupReadinessStatus", () => {
	it("returns missing when the backup directory does not exist", async () => {
		process.env.DRENYRA_BACKUP_DIR = join(
			tmpdir(),
			`drenyra-backups-missing-${Date.now()}`,
		);

		const result = await getBackupReadinessStatus(1_000_000);

		expect(result).toMatchObject({
			status: "missing",
			source: "none",
			lastBackupAt: null,
			lastBackupAgeHours: null,
		});
	});

	it("returns ok when a recent backup manifest exists", async () => {
		const backupDir = await createTempBackupDir();
		process.env.DRENYRA_BACKUP_DIR = backupDir;
		process.env.DRENYRA_BACKUP_MAX_AGE_HOURS = "24";

		const backupTimestamp = Date.parse("2026-03-03T20:00:00.000Z");
		await writeFile(
			join(backupDir, "drenyra_20260303T200000Z.dump.json"),
			JSON.stringify({
				createdAt: new Date(backupTimestamp).toISOString(),
				createdAtEpochMs: backupTimestamp,
				filePath: join(backupDir, "drenyra_20260303T200000Z.dump"),
			}),
			"utf8",
		);

		const result = await getBackupReadinessStatus(
			Date.parse("2026-03-03T22:00:00.000Z"),
		);

		expect(result).toMatchObject({
			status: "ok",
			source: "manifest",
			lastBackupAt: "2026-03-03T20:00:00.000Z",
			latestArtifact: join(backupDir, "drenyra_20260303T200000Z.dump"),
		});
		expect(result.lastBackupAgeHours).toBe(2);
	});

	it("returns warning when only an old dump exists", async () => {
		const backupDir = await createTempBackupDir();
		process.env.DRENYRA_BACKUP_DIR = backupDir;
		process.env.DRENYRA_BACKUP_MAX_AGE_HOURS = "24";

		const dumpPath = join(backupDir, "drenyra_20260301T000000Z.dump");
		await writeFile(dumpPath, "backup", "utf8");

		const staleTimestamp = Date.parse("2026-03-01T00:00:00.000Z");
		await utimes(dumpPath, staleTimestamp / 1000, staleTimestamp / 1000);
		await writeFile(
			join(backupDir, "ignore-invalid.json"),
			JSON.stringify({ createdAt: "not-a-date" }),
			"utf8",
		);

		const result = await getBackupReadinessStatus(
			Date.parse("2026-03-03T12:00:00.000Z"),
		);

		expect(result.status).toBe("warning");
		expect(result.source).toBe("filesystem");
		expect(result.latestArtifact).toBe(dumpPath);
		expect(result.lastBackupAt).not.toBeNull();
		expect(result.lastBackupAgeHours).toBeGreaterThan(24);
	});
});

async function createTempBackupDir(): Promise<string> {
	const directory = await mkdtemp(join(tmpdir(), "drenyra-backups-"));
	tempDirs.push(directory);
	return directory;
}
