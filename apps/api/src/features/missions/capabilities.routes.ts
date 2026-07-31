import { Elysia } from "elysia";

/**
 * Protocol capabilities endpoint.
 *
 * Returns the server's protocol version, minimum supported client version,
 * and the granular list of available capabilities using
 * <domain>.<action>.<mechanism>.v<major> naming.
 *
 * Used by clients to negotiate compatible interactions at connection time.
 */
export const capabilitiesRoutes = new Elysia({ prefix: "/api/v1" }).get(
	"/capabilities",
	() => ({
		protocolVersion: "1.0",
		minimumClientVersion: "1.0",
		features: [
			// Mission lifecycle
			"mission.create.http.v1",
			"mission.read.http.v1",
			"mission.list.http.v1",
			"mission.execute.http.v1",
			"mission.approve.http.v1",
			"mission.reject.http.v1",
			"mission.reconcile.http.v1",

			// Gates and exceptions
			"mission.gates.read.http.v1",
			"mission.exceptions.read.http.v1",

			// SSE streaming
			"mission.watch.sse.v1",
			"mission.watch.cursor.v1",

			// Idempotency
			"idempotency.key.v1",
			"idempotency.replay.v1",

			// Concurrency
			"concurrency.optimistic.v1",

			// Receipts
			"receipt.verify.hash.v1",

			// Multi-signer
			"approval.multi-signer.v1",

			// Protocol
			"protocol.capabilities.v1",
		],
		deprecatedFields: [],
	}),
	{
		detail: {
			tags: ["Missions"],
			summary: "Get protocol capabilities",
		},
	},
);
