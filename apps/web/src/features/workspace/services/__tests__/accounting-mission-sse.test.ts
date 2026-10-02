import { describe, expect, it } from "vitest";
import { parseSseLine } from "../accounting-mission.service";

const snap = (seq?: number) =>
	JSON.stringify({ missionId: "m1", lastEventSequence: seq });

describe("parseSseLine", () => {
	it("ignores lines that are not data frames", () => {
		expect(parseSseLine(": keep-alive", 0)).toBeNull();
		expect(parseSseLine("event: snapshot", 0)).toBeNull();
		expect(parseSseLine("", 0)).toBeNull();
		expect(parseSseLine("data:no-space", 0)).toBeNull();
	});

	it("ignores data frames with invalid JSON", () => {
		expect(parseSseLine("data: {not json", 0)).toBeNull();
	});

	it("returns the parsed snapshot for a new sequence", () => {
		expect(parseSseLine(`data: ${snap(5)}`, 3)).toEqual({
			missionId: "m1",
			lastEventSequence: 5,
		});
	});

	it("skips snapshots at or below the already-seen sequence", () => {
		expect(parseSseLine(`data: ${snap(3)}`, 3)).toBeNull();
		expect(parseSseLine(`data: ${snap(2)}`, 3)).toBeNull();
	});

	it("never skips snapshots without a sequence (or sequence 0)", () => {
		expect(parseSseLine(`data: ${snap(undefined)}`, 9)).not.toBeNull();
		expect(parseSseLine(`data: ${snap(0)}`, 9)).not.toBeNull();
	});
});
