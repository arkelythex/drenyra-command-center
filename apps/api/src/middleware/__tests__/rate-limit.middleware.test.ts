import { Elysia } from "elysia";
import { describe, expect, it } from "vitest";

import { strictRateLimit } from "../rate-limit.middleware";

describe("strictRateLimit", () => {
	it("returns 429 on 6th request within a 60s window", async () => {
		const app = new Elysia()
			.use(strictRateLimit)
			.post("/login", () => ({ ok: true }));

		const headers = new Headers({
			// Elysia doesn't expose remoteAddress in Request. Our middleware uses trusted proxy headers.
			"x-real-ip": "127.0.0.1",
		});

		for (let i = 1; i <= 5; i++) {
			const response = await app.handle(
				new Request("http://localhost/login", { method: "POST", headers }),
			);
			expect(response.status).toBe(200);
			expect(response.headers.get("X-RateLimit-Limit")).toBe("5");
		}

		const limited = await app.handle(
			new Request("http://localhost/login", { method: "POST", headers }),
		);

		expect(limited.status).toBe(429);
		expect(limited.headers.get("X-RateLimit-Limit")).toBe("5");
		expect(limited.headers.get("X-RateLimit-Remaining")).toBe("0");

		const retryAfter = limited.headers.get("Retry-After");
		expect(retryAfter).toBeTruthy();
		expect(Number.parseInt(retryAfter ?? "0", 10)).toBeGreaterThan(0);
	});
});
