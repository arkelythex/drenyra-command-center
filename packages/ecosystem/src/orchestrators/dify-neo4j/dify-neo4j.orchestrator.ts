import type { ConnectorHealth, ConnectorPort } from "../../connector.port";
import type { Neo4jOperation, GraphRAGResult, Neo4jQueryResult } from "../../adapters/neo4j/neo4j.types";
import type { DifyOperation, DifyChatResponse } from "../../adapters/dify/dify.types";
import type { ConnectorRegistry } from "../../connector.registry";
import {
  type DifyNeo4jResult,
  type FiscalQueryRequest,
  type GraphRagContext,
  type OrchestratorConfig,
  ORCHESTRATOR_DEFAULTS,
} from "./dify-neo4j.types";

const MAX_INPUTS_LENGTH = 4000;

export class DifyNeo4jOrchestrator {
  private readonly registry: ConnectorRegistry;
  private readonly config: OrchestratorConfig;

  constructor(registry: ConnectorRegistry, config?: Partial<OrchestratorConfig>) {
    this.registry = registry;
    this.config = { ...ORCHESTRATOR_DEFAULTS, ...config };
  }

  async analyze(request: FiscalQueryRequest): Promise<DifyNeo4jResult> {
    const start = performance.now();

    const neo4j = this.registry.get<ConnectorPort<Record<string, unknown>, ConnectorHealth>>("neo4j") as
      ConnectorPort<Record<string, unknown>, ConnectorHealth, Neo4jOperation> | undefined;
    const dify = this.registry.get<ConnectorPort<Record<string, unknown>, ConnectorHealth>>("dify") as
      ConnectorPort<Record<string, unknown>, ConnectorHealth, DifyOperation> | undefined;

    let graphContext: GraphRagContext;

    try {
      graphContext = await this.searchGraph(neo4j!, request);
    } catch {
      graphContext = { fiscalEntities: [], relationships: [], queryTimeMs: 0 };
    }

    const truncatedContext = this.truncateGraphContext(graphContext);

    let difyResponse: DifyNeo4jResult["difyResponse"];

    try {
      const raw = await dify!.execute<DifyChatResponse>({
        type: "chat.message",
        query: request.query,
        inputs: {
          graph_context: truncatedContext,
          fiscal_query: request.query,
          ...(request.companyRuc ? { company_ruc: request.companyRuc } : {}),
          ...(request.documentType ? { document_type: request.documentType } : {}),
          ...(request.period ? { period: request.period } : {}),
        },
        user: "drenyra-orchestrator",
        ...(request.conversationId ? { conversationId: request.conversationId } : {}),
      } as DifyOperation);

      difyResponse = {
        answer: raw.answer,
        conversationId: raw.conversation_id,
        messageId: raw.message_id,
      };
    } catch (err) {
      difyResponse = {
        answer: `Dify analysis failed: ${(err as Error).message}`,
        conversationId: "",
        messageId: "",
      };
    }

    return {
      query: request.query,
      graphContext,
      difyResponse,
      totalTimeMs: Math.round(performance.now() - start),
    };
  }

  private async searchGraph(
    neo4j: ConnectorPort<Record<string, unknown>, ConnectorHealth, Neo4jOperation>,
    request: FiscalQueryRequest,
  ): Promise<GraphRagContext> {
    const queryStart = performance.now();
    const entities: GraphRagContext["fiscalEntities"] = [];
    const relationships: GraphRagContext["relationships"] = [];

    const searchCypher = this.buildSearchCypher(request);
    const queryResult = await neo4j.execute<Neo4jQueryResult>({
      type: "graph.query",
      cypher: searchCypher.cypher,
      params: searchCypher.params,
    } as Neo4jOperation);

    for (const record of queryResult.records) {
      const node = this.extractNode(record);
      if (node) entities.push(node);
    }

    if (this.config.includeRelationships && entities.length > 0) {
      try {
        const ids = entities.map((e) => e.id);
        const relResult = await neo4j.execute<Neo4jQueryResult>({
          type: "graph.query",
          cypher: `
            MATCH (a)-[r]->(b)
            WHERE a.id IN $ids
            RETURN a.id AS source, b.id AS target, type(r) AS relType, properties(r) AS relProps
            LIMIT 50
          `,
          params: { ids },
        } as Neo4jOperation);

        for (const rec of relResult.records) {
          relationships.push({
            source: String(rec.source ?? ""),
            target: String(rec.target ?? ""),
            type: String(rec.relType ?? ""),
            properties: (rec.relProps as Record<string, unknown>) ?? {},
          });
        }
      } catch {
        // Relationships are optional — degrade gracefully
      }
    }

    return {
      fiscalEntities: entities,
      relationships,
      queryTimeMs: Math.round(performance.now() - queryStart),
    };
  }

  private buildSearchCypher(request: FiscalQueryRequest): {
    cypher: string;
    params: Record<string, unknown>;
  } {
    const conditions: string[] = [];
    const params: Record<string, unknown> = {};
    const maxResults = this.config.neo4jMaxResults;

    if (request.companyRuc) {
      conditions.push("(n.ruc CONTAINS $ruc OR n.id CONTAINS $ruc)");
      params.ruc = request.companyRuc;
    }

    if (request.documentType) {
      conditions.push("n.documentType = $docType OR n.type = $docType");
      params.docType = request.documentType;
    }

    if (request.period) {
      conditions.push("n.period = $period");
      params.period = request.period;
    }

    if (conditions.length === 0) {
      conditions.push(
        "n.name CONTAINS $query OR n.ruc CONTAINS $query OR n.id CONTAINS $query",
      );
      params.query = request.query;
    }

    const whereClause = conditions.join(" AND ");
    return {
      cypher: `MATCH (n) WHERE ${whereClause} RETURN n, labels(n) AS nodeLabels LIMIT $maxResults`,
      params: { ...params, maxResults },
    };
  }

  private extractNode(
    record: Record<string, unknown>,
  ): GraphRagContext["fiscalEntities"][number] | null {
    const node = record.n as Record<string, unknown> | undefined;
    if (!node) return null;

    const labels = (record.nodeLabels as string[]) ?? ["Unknown"];
    const id = String((node as Record<string, unknown>).id ?? node.ruc ?? "");

    return {
      id,
      labels,
      properties: node as Record<string, unknown>,
      score: (record.score as number) ?? undefined,
    };
  }

  private truncateGraphContext(context: GraphRagContext): string {
    const raw = JSON.stringify(context);
    if (raw.length <= MAX_INPUTS_LENGTH) return raw;

    const truncated: GraphRagContext = {
      ...context,
      fiscalEntities: context.fiscalEntities.slice(0, 3),
      relationships: context.relationships.slice(0, 3),
    };

    const retry = JSON.stringify(truncated);
    if (retry.length <= MAX_INPUTS_LENGTH) return retry;

    const minimal: GraphRagContext = {
      fiscalEntities: context.fiscalEntities.slice(0, 3).map((e) => ({
        id: e.id,
        labels: e.labels,
        properties: { name: e.properties.name, ruc: e.properties.ruc },
      })),
      relationships: [],
      queryTimeMs: context.queryTimeMs,
    };

    return JSON.stringify(minimal);
  }

  getConfig(): OrchestratorConfig {
    return { ...this.config };
  }
}
