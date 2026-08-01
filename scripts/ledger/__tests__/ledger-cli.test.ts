/**
 * ledger-cli tests — design §6.9 (thin adapter) — T18.
 *
 * Exercises the REAL CLI by spawning `bun scripts/ledger/cli.ts` against
 * temporary ledger files. Asserts init/append/validate/inspect behavior,
 * idempotent replay, tamper no-write, --json output and signed mode.
 */
import { spawnSync } from "node:child_process";
import { generateKeyPairSync } from "node:crypto";
import {
	existsSync,
	mkdtempSync,
	readFileSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../../..");
const CLI = resolve(__dirname, "../cli.ts");

function runCli(
	args: readonly string[],
	env: Record<string, string> = {},
) {
	const result = spawnSync("bun", [CLI, ...args], {
		cwd: ROOT,
		env: { ...process.env, ...env },
		encoding: "utf-8",
	});
	return {
		status: result.status ?? 1,
		stdout: result.stdout ?? "",
		stderr: result.stderr ?? "",
	};
}

function makeTempDir(): string {
	return mkdtempSync(join(tmpdir(), "drenyra-ledger-"));
}

function writeManifest(
	dir: string,
	keyIds: readonly string[] = [],
	required = false,
): string {
	const manifest = {
		protocolVersion: "1.0",
		hashAlgorithm: "SHA-256",
		trustRoot: { keyIds: [...keyIds] },
		jurisdiction: "PE",
		createdAt: "2026-08-01T00:00:00Z",
		signingPolicy: {
			required,
			algorithm: "Ed25519",
			keyIds: [...keyIds],
		},
		manifest: { name: "test" },
	};
	const path = join(dir, "manifest.json");
	writeFileSync(path, JSON.stringify(manifest, null, 2));
	return path;
}

function writeReceipt(
	dir: string,
	name: string,
	content: Record<string, unknown>,
): string {
	const path = join(dir, name);
	writeFileSync(path, JSON.stringify(content));
	return path;
}

function standardReceipt(dir: string, name = "EXEC-001.json"): string {
	return writeReceipt(dir, name, {
		protocolVersion: "1.0",
		receiptType: "APPROVAL",
		algorithm: "Ed25519",
		content: { decision: "APPROVE", missionId: "mis_123" },
		receiptHash: "aa",
		signerKeyId: "key_test_001",
		signerPublicKey: "MCowBQYDK2VwAyEA",
		signature: "c2ln",
		issuedAt: "2026-08-01T00:00:00Z",
	});
}

function ledgerLines(ledgerPath: string): string[] {
	const content = readFileSync(ledgerPath, "utf-8");
	const lines = content.split("\n");
	if (lines.length > 0 && lines[lines.length - 1] === "") {
		lines.pop();
	}
	return lines;
}

describe("drenyra-ledger CLI", () => {
	it("init creates a genesis ledger", () => {
		const dir = makeTempDir();
		const ledgerPath = join(dir, "main.ndjson");
		const manifestPath = writeManifest(dir);

		const outcome = runCli([
			"init",
			"--ledger",
			ledgerPath,
			"--manifest",
			manifestPath,
		]);
		expect(outcome.status).toBe(0);
		expect(outcome.stdout).toContain("initialized ledger main");
		expect(existsSync(ledgerPath)).toBe(true);

		const lines = ledgerLines(ledgerPath);
		expect(lines).toHaveLength(1);
		const genesis = JSON.parse(lines[0] ?? "") as Record<string, unknown>;
		expect(genesis.entryType).toBe("GENESIS");
		expect(genesis.sequence).toBe(1);
		expect(genesis.ledgerId).toBe("main");
	});

	it("init refuses to overwrite an existing ledger", () => {
		const dir = makeTempDir();
		const ledgerPath = join(dir, "main.ndjson");
		const manifestPath = writeManifest(dir);

		const first = runCli([
			"init",
			"--ledger",
			ledgerPath,
			"--manifest",
			manifestPath,
		]);
		expect(first.status).toBe(0);
		const before = readFileSync(ledgerPath, "utf-8");

		const second = runCli([
			"init",
			"--ledger",
			ledgerPath,
			"--manifest",
			manifestPath,
		]);
		expect(second.status).not.toBe(0);
		expect(second.stdout).toContain("refusing to overwrite");
		expect(readFileSync(ledgerPath, "utf-8")).toBe(before);
	});

	it("append links a receipt entry and validate reports clean", () => {
		const dir = makeTempDir();
		const ledgerPath = join(dir, "main.ndjson");
		const manifestPath = writeManifest(dir);
		const receiptPath = standardReceipt(dir);

		expect(
			runCli([
				"init",
				"--ledger",
				ledgerPath,
				"--manifest",
				manifestPath,
			]).status,
		).toBe(0);
		const appended = runCli([
			"append",
			"--ledger",
			ledgerPath,
			"--receipt",
			receiptPath,
			"--idempotency-key",
			"EXEC-001",
		]);
		expect(appended.status).toBe(0);
		expect(appended.stdout).toContain("appended entry");
		expect(ledgerLines(ledgerPath)).toHaveLength(2);

		const validated = runCli(["validate", "--ledger", ledgerPath]);
		expect(validated.status).toBe(0);
		expect(validated.stdout).toContain("VALID");
	});

	it("validate --json returns a parseable structured report", () => {
		const dir = makeTempDir();
		const ledgerPath = join(dir, "main.ndjson");
		const manifestPath = writeManifest(dir);
		const receiptPath = standardReceipt(dir);

		runCli(["init", "--ledger", ledgerPath, "--manifest", manifestPath]);
		runCli([
			"append",
			"--ledger",
			ledgerPath,
			"--receipt",
			receiptPath,
			"--idempotency-key",
			"EXEC-001",
		]);

		const outcome = runCli(["validate", "--ledger", ledgerPath, "--json"]);
		expect(outcome.status).toBe(0);
		const report = JSON.parse(outcome.stdout) as Record<string, unknown>;
		expect(report.valid).toBe(true);
		expect(report.ledgerId).toBe("main");
		expect(report.entriesChecked).toBe(2);
		expect(report.findings).toEqual([]);
	});

	it("replays idempotently without writing", () => {
		const dir = makeTempDir();
		const ledgerPath = join(dir, "main.ndjson");
		const manifestPath = writeManifest(dir);
		const receiptPath = standardReceipt(dir);
		const args = [
			"append",
			"--ledger",
			ledgerPath,
			"--receipt",
			receiptPath,
			"--idempotency-key",
			"EXEC-001",
		];

		runCli(["init", "--ledger", ledgerPath, "--manifest", manifestPath]);
		expect(runCli(args).status).toBe(0);
		const before = readFileSync(ledgerPath, "utf-8");

		const replay = runCli(args);
		expect(replay.status).toBe(0);
		expect(replay.stdout).toContain("idempotency-replay");
		expect(readFileSync(ledgerPath, "utf-8")).toBe(before);
	});

	it("conflicts when the same key is reused with different content", () => {
		const dir = makeTempDir();
		const ledgerPath = join(dir, "main.ndjson");
		const manifestPath = writeManifest(dir);
		const receiptPath = standardReceipt(dir);

		runCli(["init", "--ledger", ledgerPath, "--manifest", manifestPath]);
		expect(
			runCli([
				"append",
				"--ledger",
				ledgerPath,
				"--receipt",
				receiptPath,
				"--idempotency-key",
				"EXEC-001",
			]).status,
		).toBe(0);
		const before = readFileSync(ledgerPath, "utf-8");

		const different = writeReceipt(dir, "EXEC-002.json", {
			protocolVersion: "1.0",
			receiptType: "APPROVAL",
			algorithm: "Ed25519",
			content: { decision: "REJECT", missionId: "mis_456" },
			issuedAt: "2026-08-01T00:00:00Z",
		});
		const conflict = runCli([
			"append",
			"--ledger",
			ledgerPath,
			"--receipt",
			different,
			"--idempotency-key",
			"EXEC-001",
		]);
		expect(conflict.status).not.toBe(0);
		expect(conflict.stdout).toContain("idempotency-conflict");
		expect(readFileSync(ledgerPath, "utf-8")).toBe(before);
	});

	it("append on a missing ledger fails", () => {
		const dir = makeTempDir();
		const ledgerPath = join(dir, "missing.ndjson");
		const receiptPath = standardReceipt(dir);
		const outcome = runCli([
			"append",
			"--ledger",
			ledgerPath,
			"--receipt",
			receiptPath,
			"--idempotency-key",
			"EXEC-001",
		]);
		expect(outcome.status).not.toBe(0);
		expect(existsSync(ledgerPath)).toBe(false);
	});

	it("tampered ledger fails validation and append never writes", () => {
		const dir = makeTempDir();
		const ledgerPath = join(dir, "main.ndjson");
		const manifestPath = writeManifest(dir);
		const receiptPath = standardReceipt(dir);

		runCli(["init", "--ledger", ledgerPath, "--manifest", manifestPath]);
		runCli([
			"append",
			"--ledger",
			ledgerPath,
			"--receipt",
			receiptPath,
			"--idempotency-key",
			"EXEC-001",
		]);

		const lines = ledgerLines(ledgerPath);
		lines[1] = "{ corrupted";
		writeFileSync(ledgerPath, lines.join("\n") + "\n");

		const validated = runCli(["validate", "--ledger", ledgerPath]);
		expect(validated.status).not.toBe(0);
		expect(validated.stdout).toContain("INVALID");

		const before = readFileSync(ledgerPath, "utf-8");
		const appended = runCli([
			"append",
			"--ledger",
			ledgerPath,
			"--receipt",
			receiptPath,
			"--idempotency-key",
			"EXEC-002",
		]);
		expect(appended.status).not.toBe(0);
		expect(readFileSync(ledgerPath, "utf-8")).toBe(before);
	});

	it("flags an edited prior line during validation", () => {
		const dir = makeTempDir();
		const ledgerPath = join(dir, "main.ndjson");
		const manifestPath = writeManifest(dir);
		const receiptPath = standardReceipt(dir);

		runCli(["init", "--ledger", ledgerPath, "--manifest", manifestPath]);
		runCli([
			"append",
			"--ledger",
			ledgerPath,
			"--receipt",
			receiptPath,
			"--idempotency-key",
			"EXEC-001",
		]);

		const lines = ledgerLines(ledgerPath);
		const first = JSON.parse(lines[0] ?? "") as Record<string, unknown>;
		first.payload = {
			...(first.payload as Record<string, unknown>),
			protocolVersion: "9.9",
		};
		lines[0] = JSON.stringify(first);
		writeFileSync(ledgerPath, lines.join("\n") + "\n");

		const validated = runCli(["validate", "--ledger", ledgerPath]);
		expect(validated.status).not.toBe(0);
		expect(validated.stdout).toContain("INVALID");
		expect(validated.stdout).toContain("entry-hash");
	});

	it("inspect prints the recorded entries", () => {
		const dir = makeTempDir();
		const ledgerPath = join(dir, "main.ndjson");
		const manifestPath = writeManifest(dir);
		const receiptPath = standardReceipt(dir);

		runCli(["init", "--ledger", ledgerPath, "--manifest", manifestPath]);
		runCli([
			"append",
			"--ledger",
			ledgerPath,
			"--receipt",
			receiptPath,
			"--idempotency-key",
			"EXEC-001",
		]);

		const outcome = runCli(["inspect", "--ledger", ledgerPath]);
		expect(outcome.status).toBe(0);
		expect(outcome.stdout).toContain("[1] GENESIS");
		expect(outcome.stdout).toContain("[2] RECEIPT_RECORDED");
	});

	it("signed mode signs appended entries with DRENYRA_LEDGER_KEY", () => {
		const dir = makeTempDir();
		const ledgerPath = join(dir, "main.ndjson");
		const pair = generateKeyPairSync("ed25519");
		const privateKey = pair.privateKey
			.export({ type: "pkcs8", format: "der" })
			.toString("base64");
		const publicKey = pair.publicKey
			.export({ type: "spki", format: "der" })
			.toString("base64");

		const manifestPath = writeManifest(dir, ["dev-ledger-key"], true);
		const trustRootPath = join(dir, "trust-root.json");
		writeFileSync(
			trustRootPath,
			JSON.stringify({
				classification: "TEST-ONLY",
				keys: [{ keyId: "dev-ledger-key", publicKey }],
			}),
		);
		const receiptPath = standardReceipt(dir);

		expect(
			runCli([
				"init",
				"--ledger",
				ledgerPath,
				"--manifest",
				manifestPath,
			]).status,
		).toBe(0);
		const appended = runCli(
			[
				"append",
				"--ledger",
				ledgerPath,
				"--receipt",
				receiptPath,
				"--idempotency-key",
				"EXEC-001",
			],
			{
				DRENYRA_LEDGER_KEY: privateKey,
				DRENYRA_LEDGER_KEY_ID: "dev-ledger-key",
			},
		);
		expect(appended.status).toBe(0);

		const lines = ledgerLines(ledgerPath);
		const entry = JSON.parse(lines[1] ?? "") as Record<string, unknown>;
		expect(entry.signerKeyId).toBe("dev-ledger-key");
		expect(entry.signature).toBeDefined();

		const validated = runCli([
			"validate",
			"--ledger",
			ledgerPath,
			"--trust-root",
			trustRootPath,
		]);
		expect(validated.status).toBe(0);
		expect(validated.stdout).toContain("VALID");
	});

	it("prints usage and fails on an unknown command", () => {
		const outcome = runCli(["bogus"]);
		expect(outcome.status).not.toBe(0);
		expect(outcome.stdout).toContain("usage: drenyra-ledger");
	});
});
