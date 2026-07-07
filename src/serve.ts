/**
 * Drenyra Pi — HTTP Server
 *
 * Exposes agent session management, workflow execution, and health
 * endpoints for the drenyra CLI and other HTTP clients.
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { PluginRegistry } from "./plugin/registry.js";
import { SessionManager } from "./mastra/session-manager.js";
import type { AgentSession } from "./types/erp-types.js";

const app = new Hono();
const sessionManager = new SessionManager();

app.use("/*", cors());

// ─── Health ──────────────────────────────────────────────────────────────

app.get("/api/v1/health", (c) => {
	return c.json({
		success: true,
		data: {
			status: "ok",
			version: "0.1.0",
			skills: 0,
			uptime: process.uptime(),
		},
	});
});

// ─── Sessions ────────────────────────────────────────────────────────────

app.post("/api/v1/sessions", async (c) => {
	const body = await c.req.json<{
		goal: string;
		context?: Record<string, unknown>;
	}>();
	const session = sessionManager.create(body.goal, {
		tenantId: (body.context?.tenantId as string) ?? "default",
		userId: (body.context?.userId as string) ?? "cli",
		organizationId: (body.context?.organizationId as string) ?? "default",
		companyId: (body.context?.companyId as string) ?? "default",
		ruc: (body.context?.ruc as string) ?? "00000000000",
		traceId: crypto.randomUUID(),
	});
	return c.json(
		{
			success: true,
			data: { sessionId: session.id },
		},
		201,
	);
});

app.get("/api/v1/sessions", (c) => {
	const status = c.req.query("status");
	const allSessions = Array.from(sessionManager.listAll());
	const filtered = status
		? allSessions.filter((s) => s.status === status)
		: allSessions;
	return c.json({
		success: true,
		data: filtered.map(toSessionDTO),
	});
});

app.get("/api/v1/sessions/:id", (c) => {
	const session = sessionManager.get(c.req.param("id"));
	if (!session) {
		return c.json(
			{
				success: false,
				error: { code: "NOT_FOUND", message: "Session not found" },
			},
			404,
		);
	}
	return c.json({ success: true, data: toSessionDTO(session) });
});

app.post("/api/v1/sessions/:id/pause", (c) => {
	const session = sessionManager.get(c.req.param("id"));
	if (!session) {
		return c.json(
			{
				success: false,
				error: { code: "NOT_FOUND", message: "Session not found" },
			},
			404,
		);
	}
	if (session.status !== "active") {
		return c.json(
			{
				success: false,
				error: {
					code: "INVALID_STATE",
					message: `Cannot pause session in state: ${session.status}`,
				},
			},
			409,
		);
	}
	sessionManager.update(session.id, { status: "active" });
	return c.json({
		success: true,
		data: { sessionId: session.id, status: "paused" },
	});
});

app.post("/api/v1/sessions/:id/resume", (c) => {
	const session = sessionManager.get(c.req.param("id"));
	if (!session) {
		return c.json(
			{
				success: false,
				error: { code: "NOT_FOUND", message: "Session not found" },
			},
			404,
		);
	}
	return c.json({
		success: true,
		data: { sessionId: session.id, status: "active" },
	});
});

app.post("/api/v1/sessions/:id/cancel", (c) => {
	const session = sessionManager.get(c.req.param("id"));
	if (!session) {
		return c.json(
			{
				success: false,
				error: { code: "NOT_FOUND", message: "Session not found" },
			},
			404,
		);
	}
	sessionManager.update(session.id, { status: "active" });
	return c.json({
		success: true,
		data: { sessionId: session.id, status: "cancelled" },
	});
});

app.get("/api/v1/sessions/:id/timeline", (c) => {
	const session = sessionManager.get(c.req.param("id"));
	if (!session) {
		return c.json(
			{
				success: false,
				error: { code: "NOT_FOUND", message: "Session not found" },
			},
			404,
		);
	}
	const steps = session.steps.map((s) => ({
		id: s.id,
		label: s.domain,
		status: s.status,
		duration:
			s.completedAt && s.startedAt
				? s.completedAt.getTime() - s.startedAt.getTime()
				: undefined,
	}));
	return c.json({ success: true, data: steps });
});

// ─── Agents ──────────────────────────────────────────────────────────────

app.post("/api/v1/agents/:id/run", async (c) => {
	const agentId = c.req.param("id");
	const body = await c.req.json<{
		task: Record<string, unknown>;
		context: Record<string, unknown>;
	}>();
	const executionId = crypto.randomUUID();
	return c.json(
		{
			success: true,
			data: { executionId },
		},
		202,
	);
});

// ─── Workflows ───────────────────────────────────────────────────────────

app.post("/api/v1/workflows/run", async (c) => {
	const body = await c.req.json<{
		workflow: string;
		input?: Record<string, unknown>;
	}>();
	const workflowId = crypto.randomUUID();
	return c.json(
		{
			success: true,
			data: { workflowId },
		},
		202,
	);
});

app.get("/api/v1/workflows/:id", (c) => {
	return c.json({
		success: true,
		data: {
			id: c.req.param("id"),
			name: "workflow",
			status: "pending",
			currentPhase: "initializing",
			progress: 0,
			startedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		},
	});
});

// ─── Skills ────────────────────────────────────────────────────────────────

const pluginRegistry = new PluginRegistry();

app.get("/api/v1/skills", (c) => {
	const skills = pluginRegistry.listSkills();
	return c.json({
		success: true,
		data: skills.map((s) => ({
			id: s.id,
			name: s.name,
			version: s.version,
			description: s.description,
		})),
	});
});

app.post("/api/v1/skills/install", async (c) => {
	const body = await c.req.json<{ package: string; version?: string }>();
	try {
		const mod = await import(body.package);
		const skill = mod.default ?? mod.skill;
		if (!skill || typeof skill.initialize !== "function") {
			return c.json(
				{
					success: false,
					error: {
						code: "INVALID_SKILL",
						message: `${body.package} does not export a valid DrenyraSkill`,
					},
				},
				400,
			);
		}
		await pluginRegistry.installSkill(skill);
		return c.json(
			{
				success: true,
				data: { skillId: skill.id },
			},
			201,
		);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return c.json(
			{
				success: false,
				error: {
					code: "INSTALL_FAILED",
					message: `Failed to load ${body.package}: ${message}`,
				},
			},
			500,
		);
	}
});

app.post("/api/v1/skills/:id/uninstall", (c) => {
	const removed = pluginRegistry.uninstallSkill(c.req.param("id"));
	if (!removed) {
		return c.json(
			{
				success: false,
				error: { code: "NOT_FOUND", message: "Skill not found" },
			},
			404,
		);
	}
	return c.json({ success: true, data: { id: c.req.param("id"), status: "uninstalled" } });
});

// ─── Helpers ─────────────────────────────────────────────────────────────

function toSessionDTO(session: AgentSession) {
	return {
		id: session.id,
		agentId: session.activeAgent,
		agentName: session.activeAgent,
		status: session.status,
		phase:
			session.steps.length > 0
				? session.steps[session.steps.length - 1].domain
				: "idle",
		progress: Math.round(
			(session.steps.filter((s) => s.status === "completed").length /
				Math.max(session.steps.length, 1)) *
				100,
		),
		changesProposed: 0,
		evidenceCollected: 0,
		elapsedMs: Date.now() - session.startedAt.getTime(),
		tokensUsed: 0,
		risk: "low" as const,
		requiresAction: false,
		lastActivity: session.lastActivityAt.toISOString(),
		steps: session.steps.map((s) => ({
			id: s.id,
			label: s.domain,
			status: s.status,
			duration:
				s.completedAt && s.startedAt
					? s.completedAt.getTime() - s.startedAt.getTime()
					: undefined,
		})),
	};
}

// ─── Start ───────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT ?? "7377", 10);

console.log(`drenyra-pi server starting on port ${PORT}`);
console.log(`Health: http://localhost:${PORT}/api/v1/health`);

export default {
	port: PORT,
	fetch: app.fetch,
};

if (process.env.NODE_ENV !== "test") {
	Bun.serve({
		port: PORT,
		fetch: app.fetch,
	});
}
