import { BaseConnector } from "../../base.connector";
import { type DuckdbConfig, DuckdbConfigSchema } from "../../config";
import { ConnectorError } from "../../errors";
import type { DuckdbOperation, DuckdbQueryResult } from "./duckdb.types";

/**
 * DuckDB connector — in-process analytical database for fiscal analytics.
 *
 * Provides:
 * - Pre-built analytics views (cashflow, SIRE, IGV trends)
 * - Ad-hoc SQL queries for Metabase-compatible access
 * - Auto-refresh via WAL replication or event trigger
 *
 * DuckDB runs embedded (in-process), no external service needed.
 * For production, the DuckDB file can be mounted as a volume.
 *
 * Requires environment variable:
 * - DRENYRA_DUCKDB_DATABASE_PATH (default: /data/drenyra-analytics.duckdb)
 */
export class DuckdbConnector extends BaseConnector<
	DuckdbConfig,
	DuckdbOperation
> {
	readonly name = "duckdb";

	private db: unknown = null; // duckdb.Database instance
	private _config: DuckdbConfig;

	constructor() {
		super();
		this._config = DuckdbConfigSchema.parse({});
	}

	override get config(): DuckdbConfig {
		return this._config;
	}

	async connect(): Promise<void> {
		this.state = "connecting";
		try {
			this._config = DuckdbConfigSchema.parse({
				databasePath: process.env.DRENYRA_DUCKDB_DATABASE_PATH,
				pgWalConnString: process.env.DRENYRA_DUCKDB_PG_WAL_CONN_STRING,
				autoRefresh: process.env.DRENYRA_DUCKDB_AUTO_REFRESH !== "false",
			});

			// Dynamic import of DuckDB (ESM-only package)
			const duckdbModule = "duckdb";
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const duckdb: any = await import(duckdbModule);
			this.db = new duckdb.Database(this._config.databasePath);
			await this.initializeViews();
			this.state = "connected";
		} catch (err) {
			this.state = "error";
			throw new ConnectorError(
				`Failed to connect DuckDB: ${(err as Error).message}`,
				"duckdb",
				err,
			);
		}
	}

	async disconnect(): Promise<void> {
		if (
			this.db &&
			typeof (this.db as Record<string, unknown>).close === "function"
		) {
			await (this.db as { close: () => Promise<void> }).close();
		}
		this.db = null;
		this.state = "disconnected";
	}

	async execute<TResult>(
		operation: DuckdbOperation,
		..._args: unknown[]
	): Promise<TResult> {
		return this.guardedExecute(async () => {
			if (!this.db) {
				throw new ConnectorError("DuckDB not connected", "duckdb");
			}

			switch (operation.type) {
				case "query":
					return (await this.runQuery(
						operation.sql,
						operation.params,
					)) as TResult;
				case "view.cashflow":
					return (await this.queryCashflowView(operation)) as TResult;
				case "view.sire":
					return (await this.querySireView(operation)) as TResult;
				case "view.igv":
					return (await this.queryIgvView(operation)) as TResult;
				case "health":
					return (await this.performHealthCheck()) as unknown as TResult;
				default:
					throw new ConnectorError(
						`Unsupported DuckDB operation: ${JSON.stringify(operation)}`,
						"duckdb",
					);
			}
		});
	}

	private async runQuery(
		sql: string,
		params?: unknown[],
	): Promise<DuckdbQueryResult> {
		if (!this.db) throw new ConnectorError("DuckDB not connected", "duckdb");

		const conn = await (
			this.db as {
				connect: () => Promise<{
					query: (sql: string, params?: unknown[]) => Promise<unknown[]>;
				}>;
			}
		).connect();
		try {
			const rows = params
				? await conn.query(sql, params)
				: await conn.query(sql);
			return {
				columns:
					(rows as Array<Record<string, unknown>>).length > 0
						? Object.keys((rows as Array<Record<string, unknown>>)[0])
						: [],
				rows: rows as Array<Record<string, unknown>>,
				rowCount: (rows as Array<unknown>).length,
			};
		} finally {
			await conn.query("ROLLBACK"); // Clean up any pending transaction
		}
	}

	private async initializeViews(): Promise<void> {
		if (!this.db) return;

		// Create materialized views if they don't exist
		const conn = await (
			this.db as {
				connect: () => Promise<{ execute: (sql: string) => Promise<void> }>;
			}
		).connect();
		try {
			await conn.execute(`
        CREATE TABLE IF NOT EXISTS cashflow_daily (
          date DATE PRIMARY KEY,
          income DOUBLE DEFAULT 0,
          expenses DOUBLE DEFAULT 0,
          net DOUBLE DEFAULT 0,
          running_balance DOUBLE DEFAULT 0
        )
      `);
			await conn.execute(`
        CREATE TABLE IF NOT EXISTS sire_summary (
          period VARCHAR,
          type VARCHAR,
          total_base DOUBLE DEFAULT 0,
          total_igv DOUBLE DEFAULT 0,
          total DOUBLE DEFAULT 0,
          invoice_count INTEGER DEFAULT 0
        )
      `);
			await conn.execute(`
        CREATE TABLE IF NOT EXISTS igv_trends (
          month VARCHAR,
          igv_credit DOUBLE DEFAULT 0,
          igv_debit DOUBLE DEFAULT 0,
          net_igv DOUBLE DEFAULT 0
        )
      `);
		} finally {
			await conn.execute("ROLLBACK");
		}
	}

	private async queryCashflowView(op: {
		companyRuc?: string;
		fromDate?: string;
		toDate?: string;
	}): Promise<DuckdbQueryResult> {
		let sql = `SELECT date, income, expenses, net, running_balance FROM cashflow_daily WHERE 1=1`;
		const params: unknown[] = [];

		if (op.fromDate) {
			sql += ` AND date >= ?`;
			params.push(op.fromDate);
		}
		if (op.toDate) {
			sql += ` AND date <= ?`;
			params.push(op.toDate);
		}
		sql += ` ORDER BY date`;

		return this.runQuery(sql, params);
	}

	private async querySireView(op: {
		period?: string;
		docType?: string;
	}): Promise<DuckdbQueryResult> {
		let sql = `SELECT period, type, total_base, total_igv, total, invoice_count FROM sire_summary WHERE 1=1`;
		const params: unknown[] = [];

		if (op.period) {
			sql += ` AND period = ?`;
			params.push(op.period);
		}
		if (op.docType) {
			sql += ` AND type = ?`;
			params.push(op.docType);
		}
		sql += ` ORDER BY period DESC`;

		return this.runQuery(sql, params);
	}

	private async queryIgvView(op: {
		fromDate?: string;
		toDate?: string;
	}): Promise<DuckdbQueryResult> {
		let sql = `SELECT month, igv_credit, igv_debit, net_igv FROM igv_trends WHERE 1=1`;
		const params: unknown[] = [];

		if (op.fromDate) {
			sql += ` AND month >= ?`;
			params.push(op.fromDate);
		}
		if (op.toDate) {
			sql += ` AND month <= ?`;
			params.push(op.toDate);
		}
		sql += ` ORDER BY month`;

		return this.runQuery(sql, params);
	}
}
