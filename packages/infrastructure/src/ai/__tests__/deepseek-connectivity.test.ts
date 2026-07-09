/**
 * Quick connectivity test for DeepSeek V4 Flash via the model registry.
 *
 * Run: bun run packages/infrastructure/src/ai/__tests__/deepseek-connectivity.test.ts
 */

import { getModel, selectModelForTask } from "../model-registry";

async function main() {
	console.log("=== DeepSeek V4 Flash Connectivity Test ===\n");

	// 1. Verify model is in registry
	try {
		const model = getModel("deepseek-v4-flash");
		console.log("✅ getModel('deepseek-v4-flash') — model instantiated");
		console.log(`   Provider type: ${typeof model}`);
	} catch (err) {
		console.error("❌ getModel('deepseek-v4-flash') failed:", err);
		process.exit(1);
	}

	// 2. Verify selection by task
	try {
		const selection = selectModelForTask("extraction");
		console.log(`\n✅ selectModelForTask('extraction'):`);
		console.log(`   Selected: ${selection.modelKey}`);
		console.log(`   Reason: ${selection.selectionReason}`);
		console.log(
			`   Cost: $${selection.definition.costPer1MInput}/1M input, $${selection.definition.costPer1MOutput}/1M output`,
		);
	} catch (err) {
		console.error("❌ selectModelForTask failed:", err);
		process.exit(1);
	}

	// 3. Test actual LLM call (direct API — bypasses Vercel SDK for reliability)
	console.log("\n=== Testing actual LLM call ===");
	try {
		const response = await fetch(
			"https://api.deepseek.com/v1/chat/completions",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
				},
				body: JSON.stringify({
					model: "deepseek-v4-flash",
					messages: [
						{
							role: "system",
							content:
								"You are a helpful assistant. Reply with only the word 'OK'.",
						},
						{ role: "user", content: "Are you working?" },
					],
					max_tokens: 50,
				}),
			},
		);

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 200)}`);
		}

		const data = await response.json();
		console.log("✅ DeepSeek V4 Flash responded:");
		console.log(
			`   Response: "${data.choices?.[0]?.message?.content ?? "N/A"}"`,
		);
		console.log(`   Tokens: ${data.usage?.total_tokens ?? "N/A"}`);
		console.log(`   Model: ${data.model ?? "N/A"}`);
	} catch (err) {
		console.error("\n❌ DeepSeek LLM call failed:");
		console.error(`   ${err instanceof Error ? err.message : String(err)}`);
		console.error(
			"\n💡 Check: DEEPSEEK_API_KEY in .env and network access to api.deepseek.com",
		);
		process.exit(1);
	}

	console.log("\n=== ✅ DeepSeek V4 Flash is operational ===");
}

main().catch(console.error);
