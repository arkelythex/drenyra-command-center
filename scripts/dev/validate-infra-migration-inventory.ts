import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

export interface JournalEntry {
	idx: number;
	tag: string;
}

export interface MissingJournalFile extends JournalEntry {
	file: string;
}

export interface NumericMigrationFile {
	file: string;
	idx: number;
}

export interface DuplicateIndex {
	idx: number;
	tags: string[];
}

export interface DuplicateTag {
	indexes: number[];
	tag: string;
}

export interface NumericPrefixTagMismatch extends JournalEntry {
	numericPrefix: number;
}

export const INVENTORY_STATUS = {
	COHERENT: "coherent",
	DRIFT: "drift",
} as const;

export type InventoryStatus =
	(typeof INVENTORY_STATUS)[keyof typeof INVENTORY_STATUS];

export interface InventoryReport {
	duplicateIndexes: DuplicateIndex[];
	duplicateTags: DuplicateTag[];
	message: string;
	missingJournalFiles: MissingJournalFile[];
	numericPrefixTagMismatches: NumericPrefixTagMismatch[];
	status: InventoryStatus;
	unjournaledNumericFiles: NumericMigrationFile[];
}

export class InventoryInputError extends Error {
	constructor(readonly code: string) {
		super(code);
	}
}

const REPOSITORY_ROOT = resolve(import.meta.dir, "../..");
const MIGRATIONS_DIRECTORY = resolve(
	REPOSITORY_ROOT,
	"packages/infrastructure/drizzle",
);
const JOURNAL_PATH = resolve(MIGRATIONS_DIRECTORY, "meta/_journal.json");
const NUMERIC_MIGRATION_PATTERN = /^(\d{4})_.+\.sql$/;
const NUMERIC_TAG_PATTERN = /^(\d+)_/;
const REPAIR_MESSAGE =
	"Historical migration files and journal were not changed. Repair requires a controlled forward migration.";

if (import.meta.main) {
	await runCli();
}

async function runCli(): Promise<void> {
	try {
		const report = await buildInventoryReport();
		console.log(JSON.stringify(report, null, 2));
		process.exitCode = report.status === INVENTORY_STATUS.COHERENT ? 0 : 1;
	} catch (error) {
		const code =
			error instanceof InventoryInputError
				? error.code
				: "unexpected_input_error";
		console.error(
			JSON.stringify(
				{
					status: "malformed_or_unreadable",
					error: code,
					message: REPAIR_MESSAGE,
				},
				null,
				2,
			),
		);
		process.exitCode = 2;
	}
}

async function buildInventoryReport(): Promise<InventoryReport> {
	const entries = await readJournalEntries();
	const migrationFiles = await readNumericMigrationFiles();
	return classifyMigrationInventory(entries, migrationFiles);
}

export function classifyMigrationInventory(
	entries: JournalEntry[],
	migrationFiles: NumericMigrationFile[],
): InventoryReport {
	const migrationFileNames = new Set(migrationFiles.map(({ file }) => file));
	const journalFileNames = new Set(entries.map(({ tag }) => `${tag}.sql`));
	const missingJournalFiles = entries
		.filter(({ tag }) => !migrationFileNames.has(`${tag}.sql`))
		.map(({ idx, tag }) => ({ file: `${tag}.sql`, idx, tag }))
		.sort(compareMissingJournalFiles);
	const unjournaledNumericFiles = migrationFiles.filter(
		({ file }) => !journalFileNames.has(file),
	);
	const duplicateIndexes = findDuplicateIndexes(entries);
	const duplicateTags = findDuplicateTags(entries);
	const numericPrefixTagMismatches = findNumericPrefixTagMismatches(entries);
	const hasDrift = [
		missingJournalFiles,
		unjournaledNumericFiles,
		duplicateIndexes,
		duplicateTags,
		numericPrefixTagMismatches,
	].some((issues) => issues.length > 0);

	return {
		duplicateIndexes,
		duplicateTags,
		message: hasDrift
			? REPAIR_MESSAGE
			: "Migration inventory is coherent. Historical migration files and journal were not changed.",
		missingJournalFiles,
		numericPrefixTagMismatches,
		status: hasDrift ? INVENTORY_STATUS.DRIFT : INVENTORY_STATUS.COHERENT,
		unjournaledNumericFiles,
	};
}

async function readJournalEntries(): Promise<JournalEntry[]> {
	let contents: string;
	try {
		contents = await readFile(JOURNAL_PATH, "utf8");
	} catch {
		throw new InventoryInputError("journal_unreadable");
	}

	return parseJournalContents(contents);
}

export function parseJournalContents(contents: string): JournalEntry[] {
	let parsed: unknown;
	try {
		parsed = JSON.parse(contents);
	} catch {
		throw new InventoryInputError("journal_invalid_json");
	}

	if (!isRecord(parsed) || !Array.isArray(parsed.entries)) {
		throw new InventoryInputError("journal_entries_must_be_an_array");
	}

	return parsed.entries.map((entry, position) =>
		parseJournalEntry(entry, position),
	);
}

function parseJournalEntry(value: unknown, position: number): JournalEntry {
	if (!isRecord(value)) {
		throw new InventoryInputError(
			`journal_entry_${position}_must_be_an_object`,
		);
	}
	if (typeof value.idx !== "number" || !Number.isInteger(value.idx)) {
		throw new InventoryInputError(
			`journal_entry_${position}_idx_must_be_an_integer`,
		);
	}
	if (typeof value.tag !== "string" || value.tag.trim().length === 0) {
		throw new InventoryInputError(
			`journal_entry_${position}_tag_must_be_a_nonempty_string`,
		);
	}

	return { idx: value.idx, tag: value.tag };
}

async function readNumericMigrationFiles(): Promise<NumericMigrationFile[]> {
	let directoryEntries: string[];
	try {
		directoryEntries = await readdir(MIGRATIONS_DIRECTORY);
	} catch {
		throw new InventoryInputError("migration_directory_unreadable");
	}

	return directoryEntries
		.flatMap((file): NumericMigrationFile[] => {
			const match = NUMERIC_MIGRATION_PATTERN.exec(file);
			return match === null
				? []
				: [{ file, idx: Number.parseInt(match[1], 10) }];
		})
		.sort((left, right) => compareStrings(left.file, right.file));
}

function findNumericPrefixTagMismatches(
	entries: JournalEntry[],
): NumericPrefixTagMismatch[] {
	return entries
		.flatMap(({ idx, tag }): NumericPrefixTagMismatch[] => {
			const match = NUMERIC_TAG_PATTERN.exec(tag);
			if (match === null) return [];
			const numericPrefix = Number.parseInt(match[1], 10);
			return numericPrefix === idx ? [] : [{ idx, numericPrefix, tag }];
		})
		.sort(compareNumericPrefixTagMismatches);
}

function findDuplicateIndexes(entries: JournalEntry[]): DuplicateIndex[] {
	const entriesByIndex = new Map<number, string[]>();
	for (const { idx, tag } of entries) {
		const tags = entriesByIndex.get(idx) ?? [];
		tags.push(tag);
		entriesByIndex.set(idx, tags);
	}

	return [...entriesByIndex.entries()]
		.filter(([, tags]) => tags.length > 1)
		.map(([idx, tags]) => ({ idx, tags: tags.sort(compareStrings) }))
		.sort((left, right) => left.idx - right.idx);
}

function findDuplicateTags(entries: JournalEntry[]): DuplicateTag[] {
	const indexesByTag = new Map<string, number[]>();
	for (const { idx, tag } of entries) {
		const indexes = indexesByTag.get(tag) ?? [];
		indexes.push(idx);
		indexesByTag.set(tag, indexes);
	}

	return [...indexesByTag.entries()]
		.filter(([, indexes]) => indexes.length > 1)
		.map(([tag, indexes]) => ({ indexes: indexes.sort((a, b) => a - b), tag }))
		.sort((left, right) => compareStrings(left.tag, right.tag));
}

function compareMissingJournalFiles(
	left: MissingJournalFile,
	right: MissingJournalFile,
): number {
	return left.idx - right.idx || compareStrings(left.tag, right.tag);
}

function compareNumericPrefixTagMismatches(
	left: NumericPrefixTagMismatch,
	right: NumericPrefixTagMismatch,
): number {
	return left.idx - right.idx || compareStrings(left.tag, right.tag);
}

function compareStrings(left: string, right: string): number {
	return left < right ? -1 : left > right ? 1 : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}
