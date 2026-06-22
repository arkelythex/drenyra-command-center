/**
 * @fileoverview Tests para el hook useAgentStates
 * @module features/agent-swarm/hooks/__tests__/useAgentStates.test
 */

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAgentStates } from "../useAgentStates";

describe("useAgentStates", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("should initialize with default ready states", () => {
		const { result } = renderHook(() => useAgentStates(false));

		expect(result.current.states).toEqual({
			lector: "ready",
			validador: "ready",
			arbitro: "ready",
			ejecutor: "ready",
		});
		expect(result.current.progress.percentage).toBe(0);
		expect(result.current.isProcessing).toBe(false);
		expect(result.current.isComplete).toBe(false);
	});

	it("should reset states when isThinking becomes false", () => {
		const { result, rerender } = renderHook(
			({ isThinking }) => useAgentStates(isThinking),
			{ initialProps: { isThinking: true } },
		);

		// Avanzar tiempo para completar algunos agentes
		act(() => {
			vi.advanceTimersByTime(2000);
		});

		// Cambiar a false debería resetear
		rerender({ isThinking: false });

		expect(result.current.states).toEqual({
			lector: "ready",
			validador: "ready",
			arbitro: "ready",
			ejecutor: "ready",
		});
	});

	it("should call onStateChange when agent state changes", () => {
		const onStateChange = vi.fn();

		renderHook(() =>
			useAgentStates(true, {
				mode: "demo",
				onStateChange,
			}),
		);

		// El primer cambio se ejecuta en timeout(0), avanzar timers lo dispara.
		act(() => {
			vi.advanceTimersByTime(1);
		});

		expect(onStateChange).toHaveBeenCalledWith(
			expect.objectContaining({
				agentId: "lector",
				status: "active",
			}),
		);
	});

	it("should call onComplete when all agents are completed", () => {
		const onComplete = vi.fn();

		renderHook(() =>
			useAgentStates(true, {
				mode: "demo",
				onComplete,
			}),
		);

		// Avanzar tiempo hasta completar todos
		act(() => {
			vi.advanceTimersByTime(7000);
		});

		expect(onComplete).toHaveBeenCalled();
	});

	it("should calculate progress correctly", () => {
		const { result } = renderHook(() => useAgentStates(false));

		expect(result.current.progress).toEqual({
			completed: 0,
			active: 0,
			total: 4,
			percentage: 0,
		});
	});

	it("should allow manual state updates", () => {
		const { result } = renderHook(() => useAgentStates(false));

		act(() => {
			result.current.setAgentState("lector", "active", "Processing...");
		});

		expect(result.current.states.lector).toBe("active");
		expect(result.current.isProcessing).toBe(true);
	});

	it("should reset all states manually", () => {
		const { result } = renderHook(() => useAgentStates(false));

		// Cambiar un estado
		act(() => {
			result.current.setAgentState("lector", "completed");
		});

		// Resetear
		act(() => {
			result.current.resetStates();
		});

		expect(result.current.states).toEqual({
			lector: "ready",
			validador: "ready",
			arbitro: "ready",
			ejecutor: "ready",
		});
	});
});
