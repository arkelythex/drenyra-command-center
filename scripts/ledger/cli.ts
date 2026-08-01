#!/usr/bin/env bun
/**
 * drenyra-ledger — thin CLI adapter (design §6.9).
 *
 * parse args → read inputs → invoke ledger core → render structured result.
 * No cryptographic rules, chain logic or validation semantics live here;
 * everything is delegated to ./ledger-core.
 */
import { randomBytes, randomUUID } from "node:crypto";
import {
	existsSync,
	mkdirSync,
	readFileSync,
	renameSync,
	writeFileSync,
} from "node:fs";
import { basename, dirname, join } from "node:path";
import type {
	LedgerEntry,
	LedgerManifest,
	LedgerValidationReport,
} from "./ledger-core";
import {
	appendEntry,
	computeEntryHash,
	createGenesisEntry,
	createLedgerEntry,
	ENTRY_TYPE,
	extractTrustRootKeys,
	signEntry,
	sortedStringify,
	validateLedger,
} from "./ledger-core";

type ExitCode = 0 | 1;

interface ParsedArgs {
	command: string;
	options: Record<string, string>;
	flags: ReadonlySet<string>;
}

const USAGE = `usage: drenyra-ledger <command> [options]

commands:
  init     --ledger <path> --manifest <path>
  append   --ledger <path> --receipt <path> --idempotency-key <key>
  validate --ledger <path> [--trust-root <path>] [--json]
  inspect  --ledger <path>`;

// ─── Argument parsing ────────────────────────────────────────────────────────

function parseArgs(argv: readonly string[]): ParsedArgs {
	const command = argv[0] ?? "";
	const options: Record<string, string> = {};
	const flags = new Set<string>();
	for (let index = 1; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === undefined) {
			continue;
		}
		if (!arg.startsWith("--")) {
			continue;
		}
		const name = arg.slice(2);
		const next = argv[index + 1];
		if (next !== undefined && !next.startsWith("--")) {
			options[name] = next;
			index += 1;
		} else {
			flags.add(name);
		}
	}
	return { command, options, flags };
}

// ─── Input reading ───────────────────────────────────────────────────────────

function splitLines(content: string): string[] {
	const lines = content.split("\n");
	if (lines.length > 0 && lines[lines.length - 1] === "") {
		lines.pop();
	}
	return lines;
}

function parseEntries(lines: readonly string[]): LedgerEntry[] {
	const entries: LedgerEntry[] = [];
	for (const line of lines) {
		if (line === "") {
			continue;
		}
		let entry: LedgerEntry;
		try {
			entry = JSON.parse(line) as LedgerEntry;
		} catch {
			continue;
		}
		entries.push(entry);
	}
	return entries;
}

function currentActor(): string {
	return process.env.DRENYRA_LEDGER_ACTOR ?? "drenyra-ledger";
}

function ledgerIdFromPath(ledgerPath: string): string {
	return basename(ledgerPath, ".ndjson");
}

// ─── Atomic NDJSON writes ────────────────────────────────────────────────────

function writeAtomic(filePath: string, content: string): void {
	const tmpPath = join(
		dirname(filePath),
		`.${basename(filePath)}.${process.pid}.${randomBytes(4).toString("hex")}.tmp`,
	);
	writeFileSync(tmpPath, content, "utf-8");
	renameSync(tmpPath, filePath);
}

// ─── Rendering ───────────────────────────────────────────────────────────────

function renderFindings(report: LedgerValidationReport): void {
	for (const finding of report.findings) {
		console.log(
			`  [line ${finding.entryIndex}] ${finding.code} — ${finding.message}`,
		);
	}
}

// ─── Commands ────────────────────────────────────────────────────────────────

function runInit(options: Record<string, string>): ExitCode {
	const ledgerPath = options.ledger;
	const manifestPath = options.manifest;
	if (ledgerPath === undefined || manifestPath === undefined) {
		console.log("init requires --ledger <path> and --manifest <path>");
		return 1;
	}
	if (existsSync(ledgerPath)) {
		console.log(`ledger ${ledgerPath} already exists; refusing to overwrite`);
		return 1;
	}
	let manifest: unknown;
	try {
		manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
	} catch {
		console.log(`manifest file ${manifestPath} is not valid JSON`);
		return 1;
	}
	const ledgerId = ledgerIdFromPath(ledgerPath);
	const now = new Date().toISOString();
	const genesis = createGenesisEntry({
		ledgerId,
		manifest: manifest as LedgerManifest,
		actor: currentActor(),
		occurredAt: now,
		recordedAt: now,
		entryId: randomUUID(),
	});
	mkdirSync(dirname(ledgerPath), { recursive: true });
	writeAtomic(ledgerPath, sortedStringify(genesis) + "\n");
	console.log(`initialized ledger ${ledgerId} at ${ledgerPath}`);
	return 0;
}

function runAppend(options: Record<string, string>): ExitCode {
	const ledgerPath = options.ledger;
	const receiptPath = options.receipt;
	const idempotencyKey = options["idempotency-key"];
	if (
		ledgerPath === undefined ||
		receiptPath === undefined ||
		idempotencyKey === undefined
	) {
		console.log(
			"append requires --ledger <path> --receipt <path> --idempotency-key <key>",
		);
		return 1;
	}
	if (!existsSync(ledgerPath)) {
		console.log(`ledger ${ledgerPath} does not exist; run init first`);
		return 1;
	}
	const content = readFileSync(ledgerPath, "utf-8");
	const lines = splitLines(content);
	const report = validateLedger(lines);
	if (!report.valid) {
		console.log(
			`ledger ${report.ledgerId}: INVALID — ${report.findings.length} findings`,
		);
		renderFindings(report);
		return 1;
	}
	let receipt: unknown;
	try {
		receipt = JSON.parse(readFileSync(receiptPath, "utf-8"));
	} catch {
		console.log(`receipt file ${receiptPath} is not valid JSON`);
		return 1;
	}
	const entries = parseEntries(lines);
	const head = entries[entries.length - 1];
	if (head === undefined) {
		console.log("ledger has no entries; run init first");
		return 1;
	}
	const now = new Date().toISOString();
	let entry = createLedgerEntry({
		ledgerId: head.ledgerId,
		entryType: ENTRY_TYPE.RECEIPT_RECORDED,
		actor: currentActor(),
		occurredAt: now,
		recordedAt: now,
		entryId: randomUUID(),
		head,
		receipt,
		receiptId: idempotencyKey,
		idempotencyKey,
	});
	const signingKey = process.env.DRENYRA_LEDGER_KEY;
	if (signingKey !== undefined && signingKey.length > 0) {
		const keyId = process.env.DRENYRA_LEDGER_KEY_ID ?? "dev-ledger-key";
		entry = signEntry(entry, signingKey, keyId);
	}
	const result = appendEntry({
		ledgerId: head.ledgerId,
		expectedHeadHash: computeEntryHash(head),
		expectedSequence: head.sequence + 1,
		entry,
		chain: entries,
	});
	switch (result.status) {
		case "appended":
			writeAtomic(ledgerPath, content + sortedStringify(entry) + "\n");
			console.log(
				`appended entry ${entry.entryId} sequence ${entry.sequence} hash ${result.entryHash}`,
			);
			return 0;
		case "duplicate":
			return renderDuplicate(
				result.reason,
				result.existingEntry,
				idempotencyKey,
			);
		case "head-conflict":
			console.log(
				`head-conflict: expected head ${result.expectedHeadHash} but the ledger head is ${result.actualHeadHash} (sequence ${result.actualSequence}) — no write`,
			);
			return 1;
		case "invalid-chain":
			for (const finding of result.findings) {
				console.log(
					`  [line ${finding.entryIndex}] ${finding.code} — ${finding.message}`,
				);
			}
			return 1;
	}
}

function renderDuplicate(
	reason: "idempotency-replay" | "idempotency-conflict" | "entry-id-exists",
	existingEntry: LedgerEntry,
	idempotencyKey: string,
): ExitCode {
	if (reason === "idempotency-replay") {
		console.log(
			`duplicate (idempotency-replay): entry ${existingEntry.entryId} sequence ${existingEntry.sequence} — no write`,
		);
		return 0;
	}
	if (reason === "idempotency-conflict") {
		console.log(
			`duplicate (idempotency-conflict): key ${idempotencyKey} already recorded as entry ${existingEntry.entryId} with different content — no write`,
		);
		return 1;
	}
	console.log(
		`duplicate (entry-id-exists): entry ${existingEntry.entryId} — no write`,
	);
	return 1;
}

function runValidate(
	options: Record<string, string>,
	flags: ReadonlySet<string>,
): ExitCode {
	const ledgerPath = options.ledger;
	if (ledgerPath === undefined) {
		console.log("validate requires --ledger <path>");
		return 1;
	}
	if (!existsSync(ledgerPath)) {
		console.log(`ledger ${ledgerPath} does not exist`);
		return 1;
	}
	const lines = splitLines(readFileSync(ledgerPath, "utf-8"));
	let trustRootKeys: ReadonlyMap<string, string> | undefined;
	const trustRootPath = options["trust-root"];
	if (trustRootPath !== undefined) {
		let trustRoot: unknown;
		try {
			trustRoot = JSON.parse(readFileSync(trustRootPath, "utf-8"));
		} catch {
			console.log(`trust root file ${trustRootPath} is not valid JSON`);
			return 1;
		}
		trustRootKeys = extractTrustRootKeys(trustRoot);
	}
	const report = validateLedger(lines, trustRootKeys);
	if (flags.has("json")) {
		console.log(JSON.stringify(report));
		return report.valid ? 0 : 1;
	}
	if (report.valid) {
		console.log(
			`ledger ${report.ledgerId}: VALID — ${report.entriesChecked} entries, head ${report.headHash ?? "none"}`,
		);
		return 0;
	}
	console.log(
		`ledger ${report.ledgerId}: INVALID — ${report.findings.length} findings`,
	);
	renderFindings(report);
	return 1;
}

function runInspect(options: Record<string, string>): ExitCode {
	const ledgerPath = options.ledger;
	if (ledgerPath === undefined) {
		console.log("inspect requires --ledger <path>");
		return 1;
	}
	if (!existsSync(ledgerPath)) {
		console.log(`ledger ${ledgerPath} does not exist`);
		return 1;
	}
	const lines = splitLines(readFileSync(ledgerPath, "utf-8"));
	for (const line of lines) {
		if (line === "") {
			continue;
		}
		let entry: LedgerEntry;
		try {
			entry = JSON.parse(line) as LedgerEntry;
		} catch {
			continue;
		}
		console.log(
			`[${entry.sequence}] ${entry.entryType} ${entry.actor} ${entry.occurredAt} ${entry.entryId}`,
		);
	}
	return 0;
}

function main(argv: readonly string[]): ExitCode {
	const { command, options, flags } = parseArgs(argv);
	switch (command) {
		case "init":
			return runInit(options);
		case "append":
			return runAppend(options);
		case "validate":
			return runValidate(options, flags);
		case "inspect":
			return runInspect(options);
		default:
			console.log(USAGE);
			return 1;
	}
}

if (import.meta.main) {
	process.exitCode = main(process.argv.slice(2));
}
