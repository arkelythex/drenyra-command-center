/**
 * Config unit tests.
 *
 * No monetary fields exist in this module; Drenyra money values are BigInt
 * cents (repo-wide rule) and nothing here touches them.
 */
import { describe, expect, it } from "vitest";
import {
	DEFAULT_ENGRAM_TIMEOUT_MS,
	DEFAULT_ENGRAM_URL,
	engramConfig,
	isEngramEnabled,
} from "../config.js";

describe("engramConfig", () => {
	it("fails closed with defaults when no env vars are set", () => {
		const config = engramConfig({});

		expect(config.baseUrl).toBe(DEFAULT_ENGRAM_URL);
		expect(config.enabled).toBe(false);
		expect(config.timeoutMs).toBe(DEFAULT_ENGRAM_TIMEOUT_MS);
		expect("token" in config).toBe(false);
	});

	it("reads DRENYRA_ENGRAM_URL and trims trailing slashes", () => {
		const config = engramConfig({
			DRENYRA_ENGRAM_URL: "http://engram.internal:8733/",
		});

		expect(config.baseUrl).toBe("http://engram.internal:8733");
	});

	it("enables only on explicit true/1 values", () => {
		expect(engramConfig({ DRENYRA_ENGRAM_ENABLED: "true" }).enabled).toBe(true);
		expect(engramConfig({ DRENYRA_ENGRAM_ENABLED: "1" }).enabled).toBe(true);
		expect(engramConfig({ DRENYRA_ENGRAM_ENABLED: "TRUE" }).enabled).toBe(true);
		expect(engramConfig({ DRENYRA_ENGRAM_ENABLED: "yes" }).enabled).toBe(false);
		expect(engramConfig({ DRENYRA_ENGRAM_ENABLED: "0" }).enabled).toBe(false);
		expect(engramConfig({ DRENYRA_ENGRAM_ENABLED: "" }).enabled).toBe(false);
	});

	it("reads the optional bearer token", () => {
		const config = engramConfig({ DRENYRA_ENGRAM_TOKEN: "s3cret" });

		expect(config.token).toBe("s3cret");
	});

	it("omits an empty token", () => {
		const config = engramConfig({ DRENYRA_ENGRAM_TOKEN: "  " });

		expect("token" in config).toBe(false);
	});

	it("parses a custom timeout and falls back to the default on garbage", () => {
		expect(engramConfig({ DRENYRA_ENGRAM_TIMEOUT_MS: "2500" }).timeoutMs).toBe(
			2500,
		);
		expect(engramConfig({ DRENYRA_ENGRAM_TIMEOUT_MS: "abc" }).timeoutMs).toBe(
			DEFAULT_ENGRAM_TIMEOUT_MS,
		);
		expect(engramConfig({ DRENYRA_ENGRAM_TIMEOUT_MS: "-5" }).timeoutMs).toBe(
			DEFAULT_ENGRAM_TIMEOUT_MS,
		);
	});
});

describe("isEngramEnabled", () => {
	it("returns false by default (fail closed)", () => {
		expect(isEngramEnabled({})).toBe(false);
	});

	it("returns true when the flag is set", () => {
		expect(isEngramEnabled({ DRENYRA_ENGRAM_ENABLED: "true" })).toBe(true);
	});
});
