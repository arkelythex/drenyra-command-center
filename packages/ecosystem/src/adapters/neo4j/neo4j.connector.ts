import { BaseConnector } from "../../base.connector";
import { type Neo4jConfig, Neo4jConfigSchema } from "../../config";
import { ConnectorError } from "../../errors";
import type {
	FiscalGraphEntity,
	GraphRAGResult,
	Neo4jOperation,
	Neo4jQueryResult,
} from "./neo4j.types";

/**
 * Neo4j connector — graph database for the Drenyra fiscal knowledge graph.
 *
 * Provides:
 * - Cypher query execution for graph traversals
 * - Fiscal entity storage (Company, Customer, Invoice, etc.)
 * - GraphRAG search via cosine similarity on embeddings
 * - Uniqueness constraints for fiscal identifiers (RUC, invoice IDs)
 *
 * Requires environment variables:
 * - DRENYRA_NEO4J_URI (default: bolt://neo4j:7687)
 * - DRENYRA_NEO4J_USERNAME (default: neo4j)
 * - DRENYRA_NEO4J_PASSWORD
 */
export class Neo4jConnector extends BaseConnector<Neo4jConfig, Neo4jOperation> {
	readonly name = "neo4j";

	protected driver: unknown = null;
	protected _config: Neo4jConfig;

	constructor() {
		super();
		this._config = Neo4jConfigSchema.parse({});
	}

	override get config(): Neo4jConfig {
		return this._config;
	}

	/**
	 * Override in tests to inject a mock driver without importing neo4j-driver.
	 */
	protected async createDriver(
		uri: string,
		username: string,
		password: string,
	): Promise<unknown> {
		const neo4jModule = "neo4j-driver";
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const neo4j: any = await import(neo4jModule);
		return neo4j.default.driver(
			uri,
			neo4j.default.auth.basic(username, password),
			{ maxConnectionPoolSize: 5, connectionTimeout: 5000 },
		);
	}

	async connect(): Promise<void> {
		this.state = "connecting";
		try {
			this._config = Neo4jConfigSchema.parse({
				uri: process.env.DRENYRA_NEO4J_URI,
				username: process.env.DRENYRA_NEO4J_USERNAME,
				password: process.env.DRENYRA_NEO4J_PASSWORD,
			});

			this.driver = await this.createDriver(
				this._config.uri,
				this._config.username,
				this._config.password,
			);
			await (
				this.driver as { verifyConnectivity: () => Promise<void> }
			).verifyConnectivity();
			await this.createConstraints();
			this.state = "connected";
		} catch (err) {
			this.state = "error";
			if (err instanceof ConnectorError) throw err;
			throw new ConnectorError(
				`Failed to connect Neo4j: ${(err as Error).message}`,
				"neo4j",
				err,
			);
		}
	}

	async disconnect(): Promise<void> {
		if (this.driver) {
			await (this.driver as { close: () => Promise<void> }).close();
		}
		this.driver = null;
		this.state = "disconnected";
	}

	async execute<TResult>(
		operation: Neo4jOperation,
		..._args: unknown[]
	): Promise<TResult> {
		return this.guardedExecute(async () => {
			switch (operation.type) {
				case "graph.query":
					return (await this.runQuery(
						operation.cypher,
						operation.params,
					)) as TResult;
				case "graph.store_fiscal_entity":
					return (await this.storeFiscalEntity(operation.entity)) as TResult;
				case "graph.graphrag_search":
					return (await this.graphRAGSearch(
						operation.query,
						operation.embedding,
						operation.topK,
					)) as TResult;
				case "graph.create_constraints":
					await this.createConstraints();
					return { created: true } as TResult;
				case "health":
					return { status: "connected", database: "neo4j" } as TResult;
				default:
					throw new ConnectorError(
						`Unsupported Neo4j operation: ${JSON.stringify(operation)}`,
						"neo4j",
					);
			}
		});
	}

	private async runQuery(
		cypher: string,
		params?: Record<string, unknown>,
	): Promise<Neo4jQueryResult> {
		const session = await (
			this.driver as {
				session: (config?: { database?: string }) => {
					run: (
						cypher: string,
						params?: Record<string, unknown>,
					) => Promise<{
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
					}>;
					close: () => Promise<void>;
				};
			}
		).session();

		try {
			const result = await session.run(cypher, params);
			return {
				records: result.records,
				summary: {
					containsUpdates: result.summary.containsUpdates(),
					nodesCreated: result.summary.counters.nodesCreated(),
					nodesDeleted: result.summary.counters.nodesDeleted(),
					relationshipsCreated: result.summary.counters.relationshipsCreated(),
					propertiesSet: result.summary.counters.propertiesSet(),
				},
			};
		} finally {
			await session.close();
		}
	}

	private async storeFiscalEntity(
		entity: FiscalGraphEntity,
	): Promise<{ nodeCreated: boolean }> {
		return this.guardedExecute(async () => {
			if (!this.driver) {
				throw new ConnectorError("Neo4j not connected", "neo4j");
			}

			const session = (
				this.driver as {
					session: (config?: { database?: string }) => {
						executeWrite: <T>(
							txWork: (tx: {
								run: (
									cypher: string,
									params?: Record<string, unknown>,
								) => Promise<unknown>;
							}) => Promise<T>,
						) => Promise<T>;
						close: () => Promise<void>;
					};
				}
			).session();

			try {
				const id = String(
					entity.properties.id ?? entity.properties.ruc ?? crypto.randomUUID(),
				);
				const result = await session.executeWrite(async (tx) => {
					const nodeResult = await tx.run(
						`MERGE (n:${entity.label} {id: $id})
             ON CREATE SET n += $props
             ON MATCH SET n += $props
             RETURN n`,
						{ id, props: entity.properties },
					);

					if (entity.relationships) {
						for (const rel of entity.relationships) {
							const targetId = String(
								rel.targetProperties.id ??
									rel.targetProperties.ruc ??
									crypto.randomUUID(),
							);

							await tx.run(
								`MERGE (target:${rel.targetLabel} {id: $targetId})
                 ON CREATE SET target += $targetProps`,
								{ targetId, targetProps: rel.targetProperties },
							);

							await tx.run(
								`MATCH (source {id: $sourceId}), (target {id: $targetId})
                 MERGE (source)-[r:${rel.relationType}]->(target)
                 ${rel.relationProperties ? "SET r += $relProps" : ""}
                 RETURN r`,
								{
									sourceId: id,
									targetId,
									relProps: rel.relationProperties ?? {},
								},
							);
						}
					}

					return {
						nodeCreated:
							(
								nodeResult as {
									summary: { counters: { nodesCreated: () => number } };
								}
							).summary.counters.nodesCreated() > 0,
					};
				});

				return result;
			} finally {
				await session.close();
			}
		});
	}

	private async graphRAGSearch(
		_query: string,
		embedding: number[],
		topK = 10,
	): Promise<GraphRAGResult> {
		if (!this.driver) {
			throw new ConnectorError("Neo4j not connected", "neo4j");
		}

		try {
			const cypher = `
        CALL db.index.vector.queryNodes('fiscal-embeddings', $topK, $embedding)
        YIELD node, score
        OPTIONAL MATCH (node)-[r]-(related)
        RETURN node, score, collect(r) as relationships, collect(related) as relatedNodes
      `;
			const result = await this.runQuery(cypher, {
				topK,
				embedding,
			});
			return {
				nodes: result.records,
				relationships: [],
				score: result.records.length > 0 ? 1 : 0,
			};
		} catch {
			// Fallback when vector index doesn't exist
			const result = await this.runQuery(
				`MATCH (n)
         WHERE n.name CONTAINS $query OR n.ruc CONTAINS $query OR n.id CONTAINS $query
         RETURN n LIMIT $topK`,
				{ query: _query, topK },
			);
			return {
				nodes: result.records,
				relationships: [],
				score: 0,
			};
		}
	}

	private async createConstraints(): Promise<void> {
		if (!this.driver) return;

		const session = (
			this.driver as {
				session: (config?: { database?: string }) => {
					run: (cypher: string) => Promise<unknown>;
					close: () => Promise<void>;
				};
			}
		).session();

		try {
			await session.run(
				"CREATE CONSTRAINT IF NOT EXISTS FOR (c:Company) REQUIRE c.ruc IS UNIQUE",
			);
			await session.run(
				"CREATE CONSTRAINT IF NOT EXISTS FOR (i:Invoice) REQUIRE i.id IS UNIQUE",
			);
			await session.run(
				"CREATE CONSTRAINT IF NOT EXISTS FOR (cu:Customer) REQUIRE cu.ruc IS UNIQUE",
			);
		} catch {
			// Constraints already exist or neo4j version doesn't support IF NOT EXISTS
		} finally {
			await session.close();
		}
	}
}
