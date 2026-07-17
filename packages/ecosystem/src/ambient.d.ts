/**
 * Ambient type declarations for ESM-only ecosystem dependencies.
 * These packages are dynamically imported and have no @types/* packages.
 */

declare module "duckdb" {
	export class Database {
		constructor(path: string);
		connect(): Promise<{
			query: (sql: string, params?: unknown[]) => Promise<unknown[]>;
			execute: (sql: string) => Promise<void>;
		}>;
		close(): Promise<void>;
	}
}

declare module "neo4j-driver" {
	interface AuthToken {
		scheme: string;
		principal: string;
		credentials: string;
	}

	interface Driver {
		session(config?: { database?: string }): Session;
		verifyConnectivity(): Promise<void>;
		close(): Promise<void>;
	}

	interface Session {
		run(cypher: string, params?: Record<string, unknown>): Promise<QueryResult>;
		executeWrite<T>(txWork: (tx: Transaction) => Promise<T>): Promise<T>;
		close(): Promise<void>;
	}

	interface Transaction {
		run(cypher: string, params?: Record<string, unknown>): Promise<QueryResult>;
	}

	interface QueryResult {
		records: Array<Record<string, unknown>>;
		summary: {
			containsUpdates: () => boolean;
			counters: {
				nodesCreated: () => number;
				nodesDeleted: () => number;
				relationshipsCreated: () => number;
				propertiesSet: () => number;
			};
		};
	}

	const auth: {
		basic: (username: string, password: string) => AuthToken;
	};

	const driver: (
		uri: string,
		authToken: AuthToken,
		config?: Record<string, unknown>,
	) => Driver;

	export type { Driver, Session };
	export { auth };
	export default { driver, auth };
}
