import type { AgentContext,
	ApprovalRequest, } from "@drenyra/agents";
import { Elysia, t } from "elysia";
import { fail } from "../shared/api-response";
import { formatApproval, toApprovalSseChunk } from "./approval-http";

export interface ApprovalStreamRoutesDeps {
	approvalGate: {
		getPendingApprovals(context?: AgentContext): ApprovalRequest[];
	};
}

export function createApprovalStreamRoutes({
	approvalGate,
}: ApprovalStreamRoutesDeps) {
	return new Elysia({ name: "drenyra-approval-stream" }).get(
		"/approvals/stream",
		async ({ query, request }) => {
			const encoder = new TextEncoder();
			const companyId = query.companyId.trim();
			if (!companyId) {
				return Response.json(
					fail(
						"Drenyra approvals stream requires a non-empty companyId",
						"TENANT_CONTEXT_REQUIRED",
						{ field: "companyId" },
					),
					{ status: 400 },
				);
			}

			const context: AgentContext = {
				tenantId: companyId,
				userId: "sse-client",
				organizationId: companyId,
				companyId,
				ruc: "",
				traceId: `sse-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
			};

			const stream = new ReadableStream<Uint8Array>({
				async start(controller) {
					let isClosed = false;

					const emit = (event: string, payload: unknown) => {
						if (isClosed) return;
						controller.enqueue(
							encoder.encode(toApprovalSseChunk(event, payload)),
						);
					};

					const close = () => {
						if (isClosed) return;
						isClosed = true;
						try {
							controller.close();
						} catch {
							/* already closed */
						}
					};

					request.signal.addEventListener("abort", close, { once: true });
					const seen = new Map<string, string>();

					emit("connected", {
						status: "connected",
						companyId: context.companyId,
					});

					const emitSnapshot = () => {
						const pending = approvalGate.getPendingApprovals(context);
						for (const a of pending) seen.set(a.id, a.state);
						emit("snapshot", pending.map(formatApproval));
					};

					emitSnapshot();

					const pollTimer = setInterval(() => {
						if (isClosed) {
							clearInterval(pollTimer);
							return;
						}

						const current = approvalGate.getPendingApprovals(context);
						const currentIds = new Set(current.map((a) => a.id));
						for (const approval of current) {
							const prevState = seen.get(approval.id);
							if (!prevState) {
								seen.set(approval.id, approval.state);
								emit("approval.new", formatApproval(approval));
							} else if (prevState !== approval.state) {
								seen.set(approval.id, approval.state);
								emit("approval.updated", formatApproval(approval));
							}
						}
						for (const [id] of seen) {
							if (!currentIds.has(id)) {
								seen.delete(id);
								emit("approval.resolved", { id });
							}
						}
					}, 5000);

					const heartbeatTimer = setInterval(() => {
						if (isClosed) {
							clearInterval(heartbeatTimer);
							return;
						}
						emit("heartbeat", { time: new Date().toISOString() });
					}, 30000);

					request.signal.addEventListener(
						"abort",
						() => {
							isClosed = true;
							clearInterval(pollTimer);
							clearInterval(heartbeatTimer);
							close();
						},
						{ once: true },
					);
				},
			});

			return new Response(stream, {
				headers: {
					"Content-Type": "text/event-stream",
					"Cache-Control": "no-cache, no-transform",
					Connection: "keep-alive",
					"X-Accel-Buffering": "no",
				},
			});
		},
		{ query: t.Object({ companyId: t.String({ minLength: 1 }) }) },
	);
}
