#!/usr/bin/env bun
/// <reference types="node" />

/**
 * architecture:check-migration-governance — applied migrations are immutable.
 *
 * Drizzle's journal is the authority on which SQL files already ran in every deployed
 * database. Renaming, reordering or deleting an entry therefore rewrites history: the
 * migration runs twice, or never runs at all, and nothing in the repository notices.
 *
 * This gate enforces two separate things:
 *   1. Structural integrity of the journal — every tag has a file, indexes are
 *      contiguous, no tag repeats, and every `.sql` file is journaled.
 *   2. Append-only evolution against `.ci/migration-lock.json` — the locked prefix must
 *      still be there, in the same order, under the same names. Adding a migration
 *      appends to the lock (a one-line, reviewable diff); changing the past does not.
 *
 * Pre-existing violations are tracked in `.ci/architecture-baseline.json` so the gate
 * fails on new damage without pretending the current journal is healthy.
 *
 * Uso: bun scripts/architecture/check-migration-governance.ts [--update]
 * Plan: odd/tasks/architecture-enforcement-pack.md
 */

import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { type Finding, type GateOutcome, runGate } from "./rules.ts";

const DRIZZLE_DIR = join("packages", "infrastructure", "drizzle");
const JOURNAL_FILE = join(DRIZZLE_DIR, "meta", "_journal.json");
const LOCK_FILE = ".ci/migration-lock.json";

interface JournalEntry {
	idx: number;
	tag: string;
}

interface Journal {
	dialect?: string;
	entries?: JournalEntry[];
}

interface MigrationLock {
	applied: string[];
}

function readJournal(): JournalEntry[] {
	const journal = JSON.parse(readFileSync(JOURNAL_FILE, "utf8")) as Journal;
	if (!Array.isArray(journal.entries)) {
		throw new Error(`${JOURNAL_FILE} has no "entries" array`);
	}
	return journal.entries;
}

function readLock(): MigrationLock | null {
	try {
		return JSON.parse(readFileSync(LOCK_FILE, "utf8")) as MigrationLock;
	} catch {
		return null;
	}
}

function readSqlTags(): string[] {
	return readdirSync(DRIZZLE_DIR)
		.filter((name) => name.endsWith(".sql"))
		.map((name) => basename(name, ".sql"));
}

function checkStructure(entries: JournalEntry[], sqlTags: string[]): Finding[] {
	const findings: Finding[] = [];
	const sql = new Set(sqlTags);
	const seen = new Set<string>();

	for (const entry of entries) {
		if (!sql.has(entry.tag)) {
			findings.push({
				key: `missing-file:${entry.tag}`,
				message: `${JOURNAL_FILE} lists "${entry.tag}" but ${DRIZZLE_DIR}/${entry.tag}.sql does not exist`,
			});
		}
		if (seen.has(entry.tag)) {
			findings.push({
				key: `duplicate-tag:${entry.tag}`,
				message: `${JOURNAL_FILE} lists "${entry.tag}" more than once`,
			});
		}
		seen.add(entry.tag);
	}

	entries.forEach((entry, position) => {
		if (entry.idx !== position) {
			findings.push({
				key: `gap:${entry.idx}`,
				message: `${JOURNAL_FILE} entry #${position} has idx ${entry.idx}; indexes must be contiguous from 0`,
			});
		}
	});

	for (const tag of sqlTags) {
		if (!seen.has(tag)) {
			findings.push({
				key: `unjournaled:${tag}`,
				message: `${DRIZZLE_DIR}/${tag}.sql is not journaled and will never run on a fresh database`,
			});
		}
	}

	return findings;
}

function checkLock(entries: JournalEntry[]): Finding[] {
	const lock = readLock();
	if (!lock) {
		return [
			{
				key: `lock:missing`,
				message: `${LOCK_FILE} is missing; applied migrations cannot be protected`,
			},
		];
	}

	const findings: Finding[] = [];
	const current = entries.map((entry) => entry.tag);

	lock.applied.forEach((tag, position) => {
		const actual = current[position];
		if (actual === tag) return;
		if (actual === undefined) {
			findings.push({
				key: `lock:removed:${tag}`,
				message: `applied migration "${tag}" disappeared from ${JOURNAL_FILE}`,
			});
			return;
		}
		if (current.includes(tag)) {
			findings.push({
				key: `lock:reordered:${tag}`,
				message: `applied migration "${tag}" moved from position ${position} to ${current.indexOf(tag)}`,
			});
			return;
		}
		findings.push({
			key: `lock:renamed:${tag}`,
			message: `applied migration "${tag}" was renamed to "${actual}" at position ${position}`,
		});
	});

	return findings;
}

function evaluate(): GateOutcome {
	const entries = readJournal();
	const findings = [
		...checkStructure(entries, readSqlTags()),
		...checkLock(entries),
	];

	const warnings: string[] = [];
	const unjournaled = findings.filter((finding) =>
		finding.key.startsWith("unjournaled:"),
	).length;
	if (unjournaled > 0) {
		warnings.push(
			`${unjournaled} SQL file(s) exist outside the journal; repairing them changes applied-migration semantics and needs an explicit decision`,
		);
	}
	if (entries.length === 0) {
		warnings.push(`${JOURNAL_FILE} has no entries; the gate checked nothing`);
	}

	return { findings, warnings };
}

runGate("migrationGovernance", "migration governance", evaluate());
