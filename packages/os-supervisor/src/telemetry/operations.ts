/**
 * ARKELYTHEX OS — Span helper functions.
 */

import { type Span, SpanStatusCode } from "@opentelemetry/api";
import { getOsTracer } from "./tracer.js";
import type { OSSpanAttributes } from "./types.js";

/**
 * Create a span for an OS agent execution.
 */
export async function traceAgentExecution<T>(
	agentId: string,
	vertical: string,
	fn: (span: Span) => Promise<T>,
): Promise<T> {
	const tracer = getOsTracer();
	return tracer.startActiveSpan(
		"os.agent.execute",
		{ attributes: { "os.agent_id": agentId, "os.vertical": vertical } },
		async (span: Span) => {
			try {
				const result = await fn(span);
				span.setStatus({ code: SpanStatusCode.OK });
				return result;
			} catch (error) {
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: error instanceof Error ? error.message : String(error),
				});
				span.recordException(
					error instanceof Error ? error : new Error(String(error)),
				);
				throw error;
			} finally {
				span.end();
			}
		},
	);
}

/**
 * Create a span for an approval gate evaluation.
 */
export async function traceApproval<T>(
	requestId: string,
	vertical: string,
	level: string,
	fn: (span: Span) => Promise<T>,
): Promise<T> {
	const tracer = getOsTracer();
	return tracer.startActiveSpan(
		"os.approval.evaluate",
		{
			attributes: {
				"os.approval_request_id": requestId,
				"os.vertical": vertical,
				"os.approval_level": level,
			},
		},
		async (span: Span) => {
			try {
				const result = await fn(span);
				span.setStatus({ code: SpanStatusCode.OK });
				return result;
			} catch (error) {
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: error instanceof Error ? error.message : String(error),
				});
				throw error;
			} finally {
				span.end();
			}
		},
	);
}

/**
 * Create a span for a RAG query.
 */
export async function traceRagQuery<T>(
	namespace: string,
	fn: (span: Span) => Promise<T>,
): Promise<T> {
	const tracer = getOsTracer();
	return tracer.startActiveSpan(
		"os.rag.query",
		{ attributes: { "os.rag.namespace": namespace } },
		async (span: Span) => {
			try {
				const result = await fn(span);
				span.setStatus({ code: SpanStatusCode.OK });
				return result;
			} catch (error) {
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: error instanceof Error ? error.message : String(error),
				});
				throw error;
			} finally {
				span.end();
			}
		},
	);
}

/**
 * Create a span for a supervisor handleInput call.
 */
export async function traceSupervisor<T>(
	input: string,
	vertical: string,
	attributes: OSSpanAttributes,
	fn: (span: Span) => Promise<T>,
): Promise<T> {
	const tracer = getOsTracer();
	return tracer.startActiveSpan(
		"os.supervisor.handle_input",
		{
			attributes: {
				"os.vertical": vertical,
				...attributes,
			},
		},
		async (span: Span) => {
			span.setAttribute("os.input.length", input.length);
			try {
				const result = await fn(span);
				span.setStatus({ code: SpanStatusCode.OK });
				return result;
			} catch (error) {
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: error instanceof Error ? error.message : String(error),
				});
				throw error;
			} finally {
				span.end();
			}
		},
	);
}
