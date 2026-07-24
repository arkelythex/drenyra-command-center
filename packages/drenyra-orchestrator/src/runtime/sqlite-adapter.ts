/**
 * SQLite session adapter — read-only access to OpenCode session data.
 *
 * Reads from ~/.local/share/opencode/opencode.db.
 * Never writes. Detects schema version. Degrades to UNOBSERVABLE on schema change.
 * Uses Bun's SQLite when available; fails gracefully otherwise.
 */

import type { OpenCodeSessionRow, SessionAdapter } from "./cost-tracker";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _globalThis = globalThis as any;

/** Expected column set for the session table */
const EXPECTED_COLUMNS = [
	"id",
	"cost",
	"tokens_input",
	"tokens_output",
	"tokens_cache_read",
	"tokens_cache_write",
	"time_created",
	"model",
	"title",
];

// Inline minimal type for Bun's SQLite Database without importing bun types
interface BunSqliteDb {
	query(sql: string): {
		all(...params: unknown[]): Record<string, unknown>[];
		get(...params: unknown[]): Record<string, unknown> | undefined;
	};
}

let _db: BunSqliteDb | null | undefined; // undefined = not initialized

async function getDb(): Promise<BunSqliteDb | null> {
	if (_db !== undefined) return _db;

	try {
		// Dynamic import avoids Bun type dependency at compile time
		const { Database } = (await new Function(
			'return import("bun:sqlite")',
		)()) as {
			Database: new (
				path: string,
				opts?: { readonly?: boolean },
			) => BunSqliteDb;
		};

		const home =
			(_globalThis.process?.env?.HOME as string | undefined) ??
			"/home/dreamcoder08";
		const dbPath = `${home}/.local/share/opencode/opencode.db`;

		_db = new Database(dbPath, { readonly: true });
		return _db;
	} catch {
		_db = null;
		return null;
	}
}

function rowToSession(row: Record<string, unknown>): OpenCodeSessionRow {
	return {
		id: String(row.id ?? ""),
		cost: Number(row.cost ?? 0),
		tokens_input: Number(row.tokens_input ?? 0),
		tokens_output: Number(row.tokens_output ?? 0),
		tokens_cache_read: Number(row.tokens_cache_read ?? 0),
		tokens_cache_write: Number(row.tokens_cache_write ?? 0),
		time_created: Number(row.time_created ?? 0),
		model: String(row.model ?? "{}"),
		title: String(row.title ?? ""),
	};
}

export function createSqliteSessionAdapter(): SessionAdapter {
	return {
		async findRecentSessions(limit: number): Promise<OpenCodeSessionRow[]> {
			const db = await getDb();
			if (!db) return [];

			try {
				const stmt = db.query(
					"SELECT id, cost, tokens_input, tokens_output, tokens_cache_read, tokens_cache_write, time_created, model, title FROM session ORDER BY time_created DESC LIMIT ?",
				);
				return stmt.all(limit).map(rowToSession);
			} catch {
				return [];
			}
		},

		async getSession(sessionId: string): Promise<OpenCodeSessionRow | null> {
			const db = await getDb();
			if (!db) return null;

			try {
				const stmt = db.query(
					"SELECT id, cost, tokens_input, tokens_output, tokens_cache_read, tokens_cache_write, time_created, model, title FROM session WHERE id = ?",
				);
				const row = stmt.get(sessionId);
				return row ? rowToSession(row) : null;
			} catch {
				return null;
			}
		},

		async health() {
			const db = await getDb();
			if (!db) {
				return {
					ok: false,
					schemaVersion: null,
					error: "Cannot open database",
				};
			}

			try {
				const stmt = db.query("SELECT name FROM pragma_table_info('session')");
				const tableInfo = stmt.all() as { name: string }[];
				const columns = tableInfo.map((c: { name: string }) => c.name);
				const hasExpected = EXPECTED_COLUMNS.every((col) =>
					columns.includes(col),
				);

				if (!hasExpected) {
					return {
						ok: false,
						schemaVersion: null,
						error: `Schema mismatch. Expected: ${EXPECTED_COLUMNS.join(",")}. Got: ${columns.join(",")}`,
					};
				}

				return { ok: true, schemaVersion: "v1" };
			} catch (err) {
				return { ok: false, schemaVersion: null, error: String(err) };
			}
		},
	};
}
