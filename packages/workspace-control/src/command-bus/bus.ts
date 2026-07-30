import type {
	CommandEnvelope,
	WorkspaceCommand,
} from "@drenyra/workspace-contracts";
import type {
	CommandHandler,
	CommandMiddleware,
	CommandResult,
	MiddlewareContext,
} from "./types";

// ─── Helpers ────────────────────────────────────────────────────────────────

function deadLetter(
	code: string,
	error: string,
	correlationId?: string,
): CommandResult {
	const base = { ok: false as const, error, code };
	if (correlationId) {
		return { ...base, correlationId } as unknown as CommandResult;
	}
	return base as unknown as CommandResult;
}

// ─── CommandBus ─────────────────────────────────────────────────────────────

export class CommandBus {
	private readonly handlers: Map<string, CommandHandler>;
	private readonly middlewares: CommandMiddleware[];
	private readonly context: MiddlewareContext;

	constructor() {
		this.handlers = new Map();
		this.middlewares = [];
		this.context = {};
	}

	/**
	 * Register a handler for a command type.
	 */
	register(commandType: string, handler: CommandHandler): void {
		this.handlers.set(commandType, handler);
	}

	/**
	 * Add a middleware to the pipeline.
	 * Middlewares are executed in registration order.
	 */
	use(middleware: CommandMiddleware): void {
		this.middlewares.push(middleware);
	}

	/**
	 * Execute a command through the middleware pipeline.
	 *
	 * 1. Build the middleware chain
	 * 2. Run the chain, ending with the handler dispatch
	 * 3. Return the result
	 */
	execute(envelope: CommandEnvelope): CommandResult {
		const command: WorkspaceCommand = envelope.command;
		const commandType = command.commandType;

		const handler = this.handlers.get(commandType);

		// Build the final handler step (lookup + dead letter)
		const dispatch = (env: CommandEnvelope): CommandResult => {
			if (!handler) {
				return deadLetter(
					"UNKNOWN_COMMAND_TYPE",
					`No handler registered for command type: ${commandType}`,
					env.correlationId,
				);
			}

			try {
				return handler(env.command, env);
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : String(err);
				return deadLetter("HANDLER_ERROR", message, env.correlationId);
			}
		};

		// Compose middlewares from right to left
		const chain = this.middlewares.reduceRight(
			(
				next: (env: CommandEnvelope) => CommandResult,
				middleware: CommandMiddleware,
			) => {
				return (env: CommandEnvelope) => middleware(env, next);
			},
			dispatch,
		);

		return chain(envelope);
	}

	/**
	 * Returns the current middleware context (shared state).
	 */
	getContext(): Readonly<MiddlewareContext> {
		return this.context;
	}
}
