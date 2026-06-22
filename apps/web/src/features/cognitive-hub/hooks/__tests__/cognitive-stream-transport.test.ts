import { describe, expect, it } from "vitest";
import {
	buildCognitiveApiUrl,
	buildCognitiveHeaders,
} from "../cognitive-stream";

describe("cognitive stream transport helpers", () => {
	it("builds absolute URL with normalized base", () => {
		expect(
			buildCognitiveApiUrl(
				"/api/ai-swarm/cognitive-stream",
				"http://localhost:3000/",
			),
		).toBe("http://localhost:3000/api/ai-swarm/cognitive-stream");
	});

	it("includes organization header only when provided", () => {
		expect(buildCognitiveHeaders("42")).toMatchObject({
			"Content-Type": "application/json",
			"x-organization-id": "42",
		});
		expect(buildCognitiveHeaders("")).toMatchObject({
			"Content-Type": "application/json",
		});
		expect(
			(buildCognitiveHeaders("") as Record<string, string>)[
				"x-organization-id"
			],
		).toBeUndefined();
	});
});
