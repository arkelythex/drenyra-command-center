import type { CommandBus } from "./bus";
import {
	createWorkspace,
	addCompanyToWorkspace,
	changeWorkspaceObjective,
	createView,
	moveView,
} from "@drenyra/workspace-domain";
import type {
	FinancialWorkspace,
	WorkspaceView,
} from "@drenyra/workspace-domain";
import type {
	CreateWorkspaceCommand,
	AddCompanyCommand,
	ChangeObjectiveCommand,
	CreateViewCommand,
	MoveViewCommand,
	WorkspaceCommand,
	CommandEnvelope,
} from "@drenyra/workspace-contracts";
import type { CommandResult } from "./types";

// ─── In-memory stores (stubs until persistence is wired) ────────────────────

const workspaceStore = new Map<string, FinancialWorkspace>();
const viewStore = new Map<string, WorkspaceView>();

// ─── Handler factories ──────────────────────────────────────────────────────

function handleCreateWorkspace() {
	return (_cmd: WorkspaceCommand, _env: CommandEnvelope): CommandResult => {
		const cmd = _cmd as CreateWorkspaceCommand;
		const workspace = createWorkspace({
			organizationId: cmd.organizationId,
			companyIds: cmd.companyIds,
			fiscalPeriodIds: cmd.fiscalPeriodIds,
			objective: cmd.objective as FinancialWorkspace["objective"],
			layoutId: cmd.layoutId,
		});

		workspaceStore.set(workspace.workspaceId, workspace);

		return {
			ok: true,
			data: { workspaceId: workspace.workspaceId },
		};
	};
}

function handleAddCompany() {
	return (_cmd: WorkspaceCommand, _env: CommandEnvelope): CommandResult => {
		const cmd = _cmd as AddCompanyCommand;
		const workspace = workspaceStore.get(cmd.workspaceId);
		if (!workspace) {
			return {
				ok: false,
				error: `Workspace not found: ${cmd.workspaceId}`,
				code: "WORKSPACE_NOT_FOUND",
			};
		}

		try {
			const updated = addCompanyToWorkspace(workspace, cmd.companyId);
			workspaceStore.set(cmd.workspaceId, updated);
			return { ok: true, data: { revision: updated.revision } };
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : String(err);
			return { ok: false, error: message, code: "DOMAIN_ERROR" };
		}
	};
}

function handleChangeObjective() {
	return (_cmd: WorkspaceCommand, _env: CommandEnvelope): CommandResult => {
		const cmd = _cmd as ChangeObjectiveCommand;
		const workspace = workspaceStore.get(cmd.workspaceId);
		if (!workspace) {
			return {
				ok: false,
				error: `Workspace not found: ${cmd.workspaceId}`,
				code: "WORKSPACE_NOT_FOUND",
			};
		}

		const updated = changeWorkspaceObjective(
			workspace,
			cmd.objective as FinancialWorkspace["objective"],
		);
		workspaceStore.set(cmd.workspaceId, updated);
		return { ok: true, data: { revision: updated.revision } };
	};
}

function handleCreateView() {
	return (_cmd: WorkspaceCommand, _env: CommandEnvelope): CommandResult => {
		const cmd = _cmd as CreateViewCommand;
		const view = createView({
			workspaceId: cmd.workspaceId,
			kind: cmd.kind,
			label: cmd.label,
			placement: cmd.placement,
			query: cmd.query,
		});

		viewStore.set(view.viewId, view);

		return {
			ok: true,
			data: { viewId: view.viewId },
		};
	};
}

function handleMoveView() {
	return (_cmd: WorkspaceCommand, _env: CommandEnvelope): CommandResult => {
		const cmd = _cmd as MoveViewCommand;
		const view = viewStore.get(cmd.viewId);
		if (!view) {
			return {
				ok: false,
				error: `View not found: ${cmd.viewId}`,
				code: "VIEW_NOT_FOUND",
			};
		}

		const updated = moveView(view, cmd.placement);
		viewStore.set(cmd.viewId, updated);
		return { ok: true, data: { viewId: updated.viewId } };
	};
}

// Stub handlers for execution/layout commands (full implementation in PR8+)
function stubHandlerResult(commandType: string): CommandResult {
	return {
		ok: true,
		data: { message: `${commandType} stub — implementation pending` },
	};
}

// ─── Register all workspace handlers ────────────────────────────────────────

export function registerWorkspaceHandlers(bus: CommandBus): void {
	bus.register("create-workspace", handleCreateWorkspace());
	bus.register("add-company", handleAddCompany());
	bus.register("change-objective", handleChangeObjective());
	bus.register("create-view", handleCreateView());
	bus.register("move-view", handleMoveView());

	// Stub handlers for execution/layout commands
	bus.register("attach-to-execution", () =>
		stubHandlerResult("attach-to-execution"),
	);
	bus.register("detach-from-execution", () =>
		stubHandlerResult("detach-from-execution"),
	);
	bus.register("resume-workspace", () => stubHandlerResult("resume-workspace"));
	bus.register("apply-layout", () => stubHandlerResult("apply-layout"));
}
