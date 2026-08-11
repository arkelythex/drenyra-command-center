// @ts-nocheck
/* eslint-disable @typescript-eslint/ban-ts-comment */
/**
 * Basic Usage Example - AI Agent Swarm
 * Demonstrates how to process invoices using the agent system
 */

import { createAgentSwarm } from "../index";

// Example 1: Process a single invoice image
// @ts-nocheck — Example file, not production code. Types may drift from AgentEvent interface.
/**
 * example1ProcessInvoiceImage operation.
 *
 * @returns Result of example1ProcessInvoiceImage.
 * @example
 * ```ts
 * const result = await example1ProcessInvoiceImage();
 * console.log(result);
 * ```
 */
export async function example1ProcessInvoiceImage() {
	console.log("\n📝 Example 1: Process Invoice Image\n");

	// Initialize agent swarm
	const orchestrator = await createAgentSwarm({
		geminiApiKey: process.env.GOOGLE_AI_API_KEY || "your-gemini-key",
		grokApiKey: process.env.XAI_API_KEY || "your-grok-key",
	});

	// Mock base64 image (in production, this would be actual invoice image)
	const mockInvoiceImage = "data:image/jpeg;base64,/9j/4AAQSkZJRg...";

	try {
		const result = await orchestrator.processInvoice({
			type: "invoice_image",
			data: mockInvoiceImage,
			metadata: {
				ruc: "20123456789",
				period: "2026-01",
				fileName: "factura-001.jpg",
			},
		});

		// Check result
		if (result.status === "success") {
			console.log("✅ Invoice processed successfully!");
			console.log("\nInvoice Data:");
			console.log("  RUC Emisor:", result.invoiceData.issuerRuc);
			console.log("  Cliente:", result.invoiceData.customerName);
			console.log("  Número:", result.invoiceData.invoiceNumber);
			console.log(
				"  Total:",
				`${result.invoiceData.currency} ${result.invoiceData.total}`,
			);

			console.log("\nProcessing Log:");
			console.log("  Total Time:", result.processingLog.totalTime, "ms");

			if (result.xmlContent) {
				console.log("\n📄 XML Generated (first 200 chars):");
				console.log(`${result.xmlContent.substring(0, 200)}...`);
			}
		} else if (result.status === "manual_review") {
			console.log("⚠️ Invoice requires manual review");
			console.log("  Reason: Low confidence or conflicts");
		} else {
			console.log("❌ Invoice processing failed");
			console.log("  Errors:", result.errors?.map((e) => e.message).join(", "));
		}
	} catch (error) {
		console.error("❌ Error processing invoice:", error);
	}
}

// Example 2: Process with event listeners
// @ts-nocheck — Example file, not production code. Types may drift from AgentEvent interface.
/**
 * example2ProcessWithEvents operation.
 *
 * @returns Result of example2ProcessWithEvents.
 * @example
 * ```ts
 * const result = await example2ProcessWithEvents();
 * console.log(result);
 * ```
 */
export async function example2ProcessWithEvents() {
	console.log("\n📡 Example 2: Process with Event Listeners\n");

	// Create factory to access event bus
	const { AgentSwarmFactory } = await import("../index");

	const factory = new AgentSwarmFactory({
		geminiApiKey: process.env.GOOGLE_AI_API_KEY || "your-gemini-key",
		grokApiKey: process.env.XAI_API_KEY || "your-grok-key",
	});

	const orchestrator = await factory.createOrchestrator();
	const eventBus = factory.getEventBus();

	// Subscribe to events
	eventBus.on("INVOICE_RECEIVED", (event) => {
		console.log(`📥 Invoice received (Process ID: ${event.processId})`);
	});

	eventBus.on("EXTRACTION_COMPLETE", (event) => {
		console.log(
			`🔍 Extraction complete (Confidence: ${event.data.confidence})`,
		);
	});

	eventBus.on("VALIDATION_COMPLETE", (event) => {
		console.log(
			`✓ Validation complete (Compliant: ${event.data.isCompliant}, Violations: ${event.data.violations.length})`,
		);
	});

	eventBus.on("CONFLICT_DETECTED", (event) => {
		console.log(`⚠️ Conflicts detected: ${event.conflicts.length}`);
		event.conflicts.forEach((c) => {
			console.log(`  - ${c.field}: ${JSON.stringify(c.sources)}`);
		});
	});

	eventBus.on("ARBITRATION_COMPLETED", (event) => {
		console.log(`⚖️ Arbitration decision: ${event.decision.decision}`);
		console.log(`   Confidence: ${event.decision.confidence}`);
	});

	eventBus.on("PROCESS_COMPLETED", (event) => {
		console.log(`✅ Process completed in ${event.totalTime}ms`);
	});

	// Process invoice
	const mockInvoiceImage = "data:image/jpeg;base64,/9j/4AAQSkZJRg...";

	const result = await orchestrator.processInvoice({
		type: "invoice_image",
		data: mockInvoiceImage,
	});

	console.log("\nFinal Status:", result.status);
}

// Example 3: Batch processing
// @ts-nocheck — Example file, not production code. Types may drift from AgentEvent interface.
/**
 * example3BatchProcessing operation.
 *
 * @returns Result of example3BatchProcessing.
 * @example
 * ```ts
 * const result = await example3BatchProcessing();
 * console.log(result);
 * ```
 */
export async function example3BatchProcessing() {
	console.log("\n🔄 Example 3: Batch Processing\n");

	const orchestrator = await createAgentSwarm({
		geminiApiKey: process.env.GOOGLE_AI_API_KEY || "your-gemini-key",
		grokApiKey: process.env.XAI_API_KEY || "your-grok-key",
	});

	// Mock batch of invoices
	const invoiceBatch = [
		{
			type: "invoice_image" as const,
			data: "base64-1",
			metadata: { fileName: "invoice-1.jpg" },
		},
		{
			type: "invoice_image" as const,
			data: "base64-2",
			metadata: { fileName: "invoice-2.jpg" },
		},
		{
			type: "invoice_image" as const,
			data: "base64-3",
			metadata: { fileName: "invoice-3.jpg" },
		},
	];

	console.log(`Processing ${invoiceBatch.length} invoices...`);

	const startTime = Date.now();

	// Process in parallel
	const results = await Promise.allSettled(
		invoiceBatch.map((invoice) => orchestrator.processInvoice(invoice)),
	);

	const totalTime = Date.now() - startTime;

	// Analyze results
	const successful = results.filter(
		(r) => r.status === "fulfilled" && r.value.status === "success",
	).length;
	const failed = results.filter(
		(r) =>
			r.status === "rejected" ||
			(r.status === "fulfilled" && r.value.status === "failed"),
	).length;
	const manualReview = results.filter(
		(r) => r.status === "fulfilled" && r.value.status === "manual_review",
	).length;

	console.log("\nBatch Processing Results:");
	console.log(`  Total: ${invoiceBatch.length}`);
	console.log(`  Successful: ${successful}`);
	console.log(`  Failed: ${failed}`);
	console.log(`  Manual Review: ${manualReview}`);
	console.log(`  Total Time: ${totalTime}ms`);
	console.log(
		`  Avg Time per Invoice: ${Math.round(totalTime / invoiceBatch.length)}ms`,
	);
}

// Example 4: Get system statistics
// @ts-nocheck — Example file, not production code. Types may drift from AgentEvent interface.
/**
 * example4GetStats operation.
 *
 * @returns Result of example4GetStats.
 * @example
 * ```ts
 * const result = await example4GetStats();
 * console.log(result);
 * ```
 */
export async function example4GetStats() {
	console.log("\n📊 Example 4: System Statistics\n");

	const { AgentSwarmFactory } = await import("../index");

	const factory = new AgentSwarmFactory({
		geminiApiKey: process.env.GOOGLE_AI_API_KEY || "your-gemini-key",
		grokApiKey: process.env.XAI_API_KEY || "your-grok-key",
	});

	await factory.createOrchestrator();

	// Get stats
	const stats = factory.getStats();

	console.log("Gemini Instances:");
	stats.geminiInstances.forEach((instance) => {
		console.log(`  ${instance.instanceId}: ${instance.size} cached items`);
	});

	console.log("\nGrok Cache:");
	console.log(`  Size: ${stats.grokCache.size}`);
	console.log(`  TTL: ${stats.grokCache.ttl}ms`);

	console.log("\nEvent Bus:");
	console.log(
		`  Total Subscriptions: ${stats.eventBusStats.totalSubscriptions}`,
	);
	console.log(`  Event Types: ${stats.eventBusStats.eventTypes}`);
	console.log(`  History Size: ${stats.eventBusStats.historySize}`);

	// Clear caches
	console.log("\n🗑️ Clearing caches...");
	factory.clearCaches();
	console.log("✅ Caches cleared");
}

// Run examples
// @ts-nocheck — Example file, not production code. Types may drift from AgentEvent interface.
/**
 * runExamples operation.
 *
 * @returns Result of runExamples.
 * @example
 * ```ts
 * const result = await runExamples();
 * console.log(result);
 * ```
 */
export async function runExamples() {
	console.log("=".repeat(60));
	console.log("AI Agent Swarm - Usage Examples");
	console.log("=".repeat(60));

	await example1ProcessInvoiceImage();
	// await example2ProcessWithEvents();
	// await example3BatchProcessing();
	// await example4GetStats();

	console.log(`\n${"=".repeat(60)}`);
	console.log("Examples completed!");
	console.log("=".repeat(60));
}

// Uncomment to run
// runExamples().catch(console.error);
