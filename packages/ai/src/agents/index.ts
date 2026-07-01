/**
 * AI Agent Swarm - Main Entry Point
 * Arkelythex Cognitive Financial Governance System
 *
 * Multi-agent system for SUNAT 2026 invoice processing
 */

import { ContextMonitor, ContextPruner } from "../context-monitor";
import { PermissionService } from "../governance/permission-service";
import { loggers } from "../logger";
import { MemoryContextProvider } from "../memory";
import {
	PersistentCircuitBreaker,
	RetryEngine,
} from "../services/error-recovery";
import { SessionRecovery } from "../session/session-recovery";
import type { SessionStore } from "../session/session-store";
import {
	GeminiInstanceFactory,
	GrokAdapter,
	OpenRouterAdapter,
	type RouterAdapter,
} from "./adapters";
import {
	ArbitratorAgent,
	ParserAgent,
	ReaderAgent,
	ValidatorAgent,
} from "./agents";
import type { AgentSwarmConfig } from "./config/agent.config";
import { mergeWithDefaults, validateConfig } from "./config/agent.config";
import { EventBus } from "./orchestrator/event.bus";
import { WorkflowOrchestrator } from "./orchestrator/workflow.orchestrator.v2";

export * from "./adapters";
export * from "./agents";
export * from "./config/agent.config";
// Re-export components
export { EventBus } from "./orchestrator/event.bus";
export { WorkflowOrchestrator } from "./orchestrator/workflow.orchestrator.v2";
// Re-export types
export type * from "./types";

/**
 * Agent Swarm Factory
 * Initializes the complete agent ecosystem
 * @example
 * ```ts
 * const value = new AgentSwarmFactory();
 * console.log(value);
 * ```
 */

export class AgentSwarmFactory {
	private config: Required<AgentSwarmConfig>;
	private geminiFactory: GeminiInstanceFactory;
	private grokAdapter?: GrokAdapter;
	private openRouterAdapter?: OpenRouterAdapter;
	private eventBus: EventBus;
	private orchestrator?: WorkflowOrchestrator;
	private contextMonitor?: ContextMonitor;
	private contextPruner?: ContextPruner;
	private permissionService: PermissionService;
	private sessionStore?: SessionStore;
	private memoryProvider?: MemoryContextProvider;
	private retryEngine?: RetryEngine;
	private persistentCircuitBreaker?: PersistentCircuitBreaker;
	private routerAdapter?: RouterAdapter;

	constructor(config: AgentSwarmConfig) {
		// Validate and merge with defaults
		validateConfig(config);
		this.config = mergeWithDefaults(config);

		loggers.ai.info("AgentSwarmFactory initializing");

		// Initialize PermissionService (P5 granular permissions)
		// Empty by default — PR #3 adds DB-backed loading.
		this.permissionService = new PermissionService();

		// Initialize AI adapters
		this.geminiFactory = new GeminiInstanceFactory(this.config.geminiApiKey);

		// Initialize GrokAdapter if API key provided
		if (this.config.grokApiKey) {
			this.grokAdapter = new GrokAdapter({
				apiKey: this.config.grokApiKey,
				model: "grok-code-fast-1", // Default model for direct Grok usage
				cacheEnabled: this.config.cacheEnabled,
			});
		}

		// Initialize OpenRouterAdapter if API key provided
		if (this.config.openRouterApiKey) {
			this.openRouterAdapter = new OpenRouterAdapter({
				apiKey: this.config.openRouterApiKey,
				model: this.config.models.validator || "x-ai/grok-2-vision-1212", // Use configured validator model or default
				cacheEnabled: this.config.cacheEnabled,
				siteUrl: this.config.siteUrl,
				siteName: this.config.siteName,
			});
		}

		// Initialize event bus
		this.eventBus = new EventBus();

		// Initialize error recovery if enabled
		if (this.config.enableErrorRecovery) {
			this.retryEngine = new RetryEngine();
			this.persistentCircuitBreaker = new PersistentCircuitBreaker(
				"orchestrator",
				"agent",
				5,
				60000,
			);
			loggers.ai.info(
				"Error recovery initialized with RetryEngine + PersistentCircuitBreaker",
			);
		}

		// Store RouterAdapter if provided
		if (this.config.routerAdapter) {
			this.routerAdapter = this.config.routerAdapter;
			loggers.ai.info("RouterAdapter configured");
		}

		loggers.ai.info("AgentSwarmFactory initialized");
	}

	/**
	 * Create orchestrator with all agents
	 */
	async createOrchestrator(): Promise<WorkflowOrchestrator> {
		if (this.orchestrator) {
			loggers.ai.info("Reusing existing orchestrator");
			return this.orchestrator;
		}

		loggers.ai.info("Creating orchestrator V2");

		// Create Gemini instances for Reader, Parser, and Arbitrator
		const readerGemini = this.geminiFactory.getInstance("reader", {
			model: this.config.models.reader,
			cacheEnabled: this.config.cacheEnabled,
			temperature: 0.3,
		});

		const parserGemini = this.geminiFactory.getInstance("parser", {
			model: this.config.models.parser,
			cacheEnabled: this.config.cacheEnabled,
			temperature: 0.2,
		});

		const arbitratorGemini = this.geminiFactory.getInstance("arbitrator", {
			model: this.config.models.arbitrator,
			cacheEnabled: this.config.cacheEnabled,
			temperature: 0.1, // Low temperature for consistent decisions
		});

		// Create agents
		const readerAgent = new ReaderAgent(
			readerGemini,
			this.memoryProvider,
			this.routerAdapter,
		);
		const parserAgent = new ParserAgent(parserGemini, this.routerAdapter);

		// Determine which adapter to use for Validator
		// Priority: OpenRouter (Hybrid Strategy) > Grok Direct
		let validatorAdapter: GrokAdapter | OpenRouterAdapter;

		if (this.config.openRouterApiKey && this.openRouterAdapter) {
			loggers.ai.info("Using OpenRouter for validator agent");
			validatorAdapter = this.openRouterAdapter;
		} else if (this.config.grokApiKey && this.grokAdapter) {
			loggers.ai.info("Using Grok direct for validator agent");
			validatorAdapter = this.grokAdapter;
		} else {
			throw new Error(
				"No valid adapter available for Validator Agent. Configure grokApiKey or openRouterApiKey.",
			);
		}

		const validatorAgent = new ValidatorAgent(
			validatorAdapter,
			this.routerAdapter,
		);
		const arbitratorAgent = new ArbitratorAgent(
			arbitratorGemini,
			this.routerAdapter,
		);

		// Initialize session store for persistence (graceful fallback if DB unavailable)
		let sessionStore: SessionStore | undefined;
		try {
			const { db } = await import("@arkelythex/persistence/client");
			const { PostgresSessionStore } = await import(
				"../session/postgres-store"
			);
			sessionStore = new PostgresSessionStore(db);
			this.sessionStore = sessionStore;
			this.memoryProvider = new MemoryContextProvider(sessionStore);
			loggers.ai.info(
				"PostgresSessionStore initialized for agent run persistence",
			);
		} catch (err) {
			loggers.ai.warn("Session store unavailable — persistence disabled", {
				error: err,
			});
		}

		// Initialize context monitor if enabled
		if (this.config.enableContextMonitoring) {
			this.contextMonitor = new ContextMonitor(sessionStore, {
				threshold: this.config.contextThreshold ?? 0.95,
			});
			loggers.ai.info("Context monitoring enabled", {
				threshold: this.config.contextThreshold,
			});
		}

		// Initialize context pruner if enabled
		if (this.config.enablePruning) {
			this.contextPruner = new ContextPruner({
				strategy: this.config.pruningStrategy,
				maxMessages: this.config.maxMessages,
				tokenBudgetRatio: this.config.tokenBudgetRatio,
				enableSummarization: this.config.enableSummarization,
			});
			loggers.ai.info("Context pruning enabled", {
				strategy: this.config.pruningStrategy,
				maxMessages: this.config.maxMessages,
				tokenBudgetRatio: this.config.tokenBudgetRatio,
				enableSummarization: this.config.enableSummarization,
			});
		}

		// Create orchestrator V2
		const orchestratorConfig: import("./orchestrator/workflow-v2/types").OrchestratorConfig =
			{
				enableCircuitBreaker: true,
				enableMetrics: this.config.enableMetrics,
				agentTimeoutMs: 45000, // Slightly higher for complex vision tasks
				maxRetries: 2,
				sessionStore,
				contextMonitor: this.contextMonitor,
				pruner: this.contextPruner,
				retryEngine: this.retryEngine,
				persistentCircuitBreaker: this.persistentCircuitBreaker,
			};

		// Wire OSE service if enabled
		if (this.config.enableOSE) {
			const oseService = await this.createOSEService();
			if (oseService) {
				orchestratorConfig.oseService = oseService;
				loggers.ai.info("OSE submission service wired into orchestrator");
			}
		}

		this.orchestrator = new WorkflowOrchestrator(
			readerAgent,
			parserAgent,
			validatorAgent,
			arbitratorAgent,
			orchestratorConfig,
			this.eventBus,
		);

		loggers.ai.info("Orchestrator V2 created");

		return this.orchestrator;
	}

	/**
	 * Get event bus
	 */
	getEventBus(): EventBus {
		return this.eventBus;
	}

	/**
	 * Get Gemini factory
	 */
	getGeminiFactory(): GeminiInstanceFactory {
		return this.geminiFactory;
	}

	/**
	 * Get Grok adapter
	 */
	getGrokAdapter(): GrokAdapter | undefined {
		return this.grokAdapter;
	}

	/**
	 * Get OpenRouter adapter
	 */
	getOpenRouterAdapter(): OpenRouterAdapter | undefined {
		return this.openRouterAdapter;
	}

	/**
	 * Get configuration
	 */
	getConfig(): Required<AgentSwarmConfig> {
		return { ...this.config };
	}

	/**
	 * Get context monitor (external wiring for gateway integration)
	 */
	getContextMonitor(): ContextMonitor | undefined {
		return this.contextMonitor;
	}

	/**
	 * Get the PermissionService instance.
	 * Exposed for external wiring (bridge permission check, API integration).
	 */
	getPermissionService(): PermissionService {
		return this.permissionService;
	}

	/**
	 * Get context pruner (external wiring for gateway integration)
	 */
	getContextPruner(): ContextPruner | undefined {
		return this.contextPruner;
	}

	/**
	 * Create a permission check callback for bridge/permission gate integration.
	 * Returns a function that can be passed as `permissionCheck` to
	 * `streamWithToolExecution()`.
	 *
	 * @param context - Optional context for scoped permission lookups (companyId, orgId).
	 * @returns PermissionCheckFn callback.
	 */
	createPermissionCheck(context?: {
		companyId?: string;
		organizationId?: string;
	}): (toolName: string) => { effect: "ALLOW" | "DENY" | "REQUIRE_APPROVAL" } {
		const service = this.permissionService;
		return (toolName: string) => {
			const result = service.canExecute(toolName, context);
			return { effect: result.effect };
		};
	}

	/**
	 * Get the RetryEngine instance for error recovery.
	 * Returns undefined if error recovery is not enabled.
	 */
	getRetryEngine(): RetryEngine | undefined {
		return this.retryEngine;
	}

	/**
	 * Get the PersistentCircuitBreaker instance.
	 * Returns undefined if error recovery is not enabled.
	 */
	getPersistentCircuitBreaker(): PersistentCircuitBreaker | undefined {
		return this.persistentCircuitBreaker;
	}

	/**
	 * Get a SessionRecovery instance bound to the internal session store.
	 * Returns null if no session store was initialized (e.g., DB unavailable on startup).
	 */
	getSessionRecovery(): SessionRecovery | null {
		if (!this.sessionStore) return null;
		return new SessionRecovery(this.sessionStore);
	}

	/**
	 * Get the MemoryContextProvider instance (lazy init if store is available).
	 */
	getMemoryProvider(): MemoryContextProvider | undefined {
		if (this.memoryProvider) return this.memoryProvider;
		if (this.sessionStore) {
			this.memoryProvider = new MemoryContextProvider(this.sessionStore);
			return this.memoryProvider;
		}
		return undefined;
	}

	/**
	 * Lazily create the OSE service client for the orchestrator.
	 * Uses dynamic import to avoid startup failures if infrastructure package is not fully available.
	 * Returns undefined if the OSE module cannot be loaded.
	 */
	private async createOSEService(): Promise<
		| import("./orchestrator/workflow-v2/types").OrchestratorConfig["oseService"]
		| undefined
	> {
		try {
			const { OSEService } = await import("@arkelythex/infrastructure/ose");
			return {
				sendInvoice: async (data) => {
					const result = await OSEService.sendInvoice(data);
					return {
						success: result.success,
						cdrContent: result.cdrContent,
						cdrStatus: result.cdrStatus,
						cdrMessage: result.cdrMessage,
						sunatCode: result.sunatCode,
						error: result.error,
					};
				},
			};
		} catch (error) {
			loggers.ai.warn(
				"[OSE] Failed to load OSE service from @arkelythex/infrastructure/ose:",
				error,
			);
			return undefined;
		}
	}

	/**
	 * Clear all caches
	 */
	clearCaches(): void {
		loggers.ai.info("Clearing swarm caches");
		this.geminiFactory.clearAllCaches();
		if (this.grokAdapter) this.grokAdapter.clearCache();
		if (this.openRouterAdapter) this.openRouterAdapter.clearCache();
		loggers.ai.info("Swarm caches cleared");
	}

	/**
	 * Get statistics
	 */
	getStats(): {
		geminiInstances: Array<{ instanceId: string; size: number; ttl: number }>;
		grokCache?: { size: number; ttl: number };
		openRouterCache?: { size: number; ttl: number };
		eventBusStats: {
			totalSubscriptions: number;
			eventTypes: number;
			historySize: number;
		};
	} {
		return {
			geminiInstances: this.geminiFactory.getStats(),
			grokCache: this.grokAdapter?.getCacheStats(),
			openRouterCache: this.openRouterAdapter?.getCacheStats(),
			eventBusStats: this.eventBus.getStats(),
		};
	}

	/**
	 * Destroy factory and cleanup resources
	 */
	destroy(): void {
		loggers.ai.info("Destroying AgentSwarmFactory");
		this.clearCaches();
		this.eventBus.destroy();
		loggers.ai.info("AgentSwarmFactory destroyed");
	}
}

/**
 * Create agent swarm (convenience function)
 * @param config - Input for config.
 * @returns Result of createAgentSwarm.
 * @example
 * ```ts
 * const result = await createAgentSwarm({} as AgentSwarmConfig);
 * console.log(result);
 * ```
 */

export async function createAgentSwarm(
	config: AgentSwarmConfig,
): Promise<WorkflowOrchestrator> {
	const factory = new AgentSwarmFactory(config);
	return factory.createOrchestrator();
}
