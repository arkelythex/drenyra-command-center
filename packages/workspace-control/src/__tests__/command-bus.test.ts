import { describe, it, expect, vi } from "vitest";
import { CommandBus } from "../command-bus/bus";
import {
	validationMiddleware,
	authMiddleware,
} from "../command-bus/middlewares";
import type {
	CommandEnvelope,
	WorkspaceCommand,
} from "@drenyra/workspace-contracts";
import type { CommandResult } from "../command-bus/types";

// ─── Helpers ────────────────────────────────────────────────────────────────

function envelope(
	command: WorkspaceCommand,
	overrides?: Partial<Omit<CommandEnvelope, "command">>,
): CommandEnvelope {
	return { command, ...overrides };
}

const validCreate: WorkspaceCommand = {
	commandType: "create-workspace",
	organizationId: "org-1",
	companyIds: ["company-1"],
	fiscalPeriodIds: ["fp-2025-01"],
	objective: { kind: "monthly-close", fiscalPeriodId: "fp-2025-01" },
	layoutId: null,
} as WorkspaceCommand;

// ─── 1. Create CommandBus ───────────────────────────────────────────────────

describe("CommandBus", () => {
	it("creates a CommandBus with no handlers initially", () => {
		const bus = new CommandBus();
		expect(bus).toBeInstanceOf(CommandBus);
	});

	// ─── 2. Register handler + execute ──────────────────────────────────────

	it("registers a handler and executes it", () => {
		const bus = new CommandBus();
		const handler = vi
			.fn()
			.mockReturnValue({ ok: true, data: "done" } as CommandResult);

		bus.register("create-workspace", handler);
		const result = bus.execute(envelope(validCreate));

		expect(handler).toHaveBeenCalledTimes(1);
		expect(handler).toHaveBeenCalledWith(validCreate, expect.any(Object));
		expect(result).toEqual({ ok: true, data: "done" });
	});

	// ─── 3. Execute unknown commandType → error ─────────────────────────────

	it("returns error for unknown commandType", () => {
		const bus = new CommandBus();
		const result = bus.execute(
			envelope({
				commandType: "unknown-command",
			} as unknown as WorkspaceCommand),
		);

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.code).toBe("UNKNOWN_COMMAND_TYPE");
		}
	});

	// ─── 4. Middleware runs before handler ──────────────────────────────────

	it("runs middleware before handler", () => {
		const bus = new CommandBus();
		const order: string[] = [];

		bus.use((_env, next) => {
			order.push("middleware");
			return next(_env);
		});

		bus.register("create-workspace", () => {
			order.push("handler");
			return { ok: true, data: null };
		});

		bus.execute(envelope(validCreate));
		expect(order).toEqual(["middleware", "handler"]);
	});

	// ─── 5. Middleware can short-circuit ─────────────────────────────────────

	it("middleware can short-circuit and skip the handler", () => {
		const bus = new CommandBus();
		const handler = vi.fn();

		bus.use((_env, _next) => {
			return { ok: false, error: "blocked by middleware", code: "BLOCKED" };
		});

		bus.register("create-workspace", handler);
		const result = bus.execute(envelope(validCreate));

		expect(handler).not.toHaveBeenCalled();
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.code).toBe("BLOCKED");
		}
	});

	// ─── 6. Validation middleware: invalid command → error ──────────────────

	it("validation middleware rejects invalid command", () => {
		const bus = new CommandBus();

		bus.use(validationMiddleware());
		bus.register("create-workspace", () => ({ ok: true, data: "ok" }));

		const invalid = envelope({
			commandType: "create-workspace",
			organizationId: "",
			companyIds: [],
			fiscalPeriodIds: [],
			objective: { kind: "monthly-close", fiscalPeriodId: "fp-1" },
			layoutId: null,
		} as unknown as WorkspaceCommand);

		const result = bus.execute(invalid);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.code).toBe("VALIDATION_ERROR");
		}
	});

	// ─── 7. Auth middleware: missing userId → error ──────────────────────────

	it("auth middleware rejects missing userId", () => {
		const bus = new CommandBus();

		bus.use(authMiddleware());
		bus.register("create-workspace", () => ({ ok: true, data: "ok" }));

		const result = bus.execute(envelope(validCreate)); // no userId
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.code).toBe("UNAUTHORIZED");
		}
	});

	it("auth middleware allows when userId is present", () => {
		const bus = new CommandBus();

		bus.use(authMiddleware());
		bus.register("create-workspace", () => ({ ok: true, data: "ok" }));

		const result = bus.execute(envelope(validCreate, { userId: "user-1" }));
		expect(result.ok).toBe(true);
	});

	// ─── 8. Multiple middlewares run in order ────────────────────────────────

	it("multiple middlewares run in registration order", () => {
		const bus = new CommandBus();
		const order: string[] = [];

		bus.use((_env, next) => {
			order.push("mw1");
			return next(_env);
		});
		bus.use((_env, next) => {
			order.push("mw2");
			return next(_env);
		});
		bus.use((_env, next) => {
			order.push("mw3");
			return next(_env);
		});

		bus.register("create-workspace", () => {
			order.push("handler");
			return { ok: true, data: null };
		});

		bus.execute(envelope(validCreate));
		expect(order).toEqual(["mw1", "mw2", "mw3", "handler"]);
	});

	// ─── 9. Handler receives correct command type ────────────────────────────

	it("handler receives the correct command type", () => {
		const bus = new CommandBus();
		const received: WorkspaceCommand[] = [];

		bus.register("create-workspace", (cmd) => {
			received.push(cmd);
			return { ok: true, data: null };
		});

		bus.register("add-company", (cmd) => {
			received.push(cmd);
			return { ok: true, data: null };
		});

		bus.execute(envelope(validCreate));
		expect(received[0]!.commandType).toBe("create-workspace");

		bus.execute(
			envelope({
				commandType: "add-company",
				workspaceId: "00000000-0000-0000-0000-000000000001",
				companyId: "company-2",
			} as unknown as WorkspaceCommand),
		);
		expect(received[1]!.commandType).toBe("add-company");
	});

	// ─── 10. CommandBus returns handler result ───────────────────────────────

	it("returns the handler result directly", () => {
		const bus = new CommandBus();

		bus.register(
			"create-workspace",
			() =>
				({
					ok: true,
					data: { workspaceId: "ws-123" },
					correlationId: "corr-xyz",
				}) as CommandResult,
		);

		const result = bus.execute(
			envelope(validCreate, { correlationId: "corr-xyz" }),
		);
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.data).toEqual({ workspaceId: "ws-123" });
			expect(result.correlationId).toBe("corr-xyz");
		}
	});

	// ─── 11. Idempotency: no dedup by default ────────────────────────────────

	it("executes same command twice (no idempotency dedup by default)", () => {
		const bus = new CommandBus();
		const handler = vi.fn().mockReturnValue({ ok: true, data: "done" });

		bus.register("create-workspace", handler);

		bus.execute(envelope(validCreate));
		bus.execute(envelope(validCreate));

		expect(handler).toHaveBeenCalledTimes(2);
	});

	// ─── 12. Handler that throws returns error result ────────────────────────

	it("wraps handler errors as error results", () => {
		const bus = new CommandBus();

		bus.register("create-workspace", () => {
			throw new Error("domain invariant violated");
		});

		const result = bus.execute(envelope(validCreate));
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.code).toBe("HANDLER_ERROR");
			expect(result.error).toContain("domain invariant violated");
		}
	});
});
