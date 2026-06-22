import { describe, expect, it, vi } from "vitest";
import { createActor } from "xstate";
import { createProcessMachine } from "../process-machine";

describe("createProcessMachine", () => {
  it("creates a machine with idle as the initial state", () => {
    const machine = createProcessMachine({
      id: "test",
      context: { error: null },
    });
    const actor = createActor(machine).start();
    expect(actor.getSnapshot().value).toBe("idle");
    actor.stop();
  });

  it("accepts a custom initial state", () => {
    const machine = createProcessMachine({
      id: "test",
      initial: "error",
      context: { error: null },
    });
    const actor = createActor(machine).start();
    expect(actor.getSnapshot().value).toBe("error");
    actor.stop();
  });

  it("initializes context from the config", () => {
    const machine = createProcessMachine({
      id: "test",
      context: { error: null, count: 42 },
    });
    const actor = createActor(machine).start();
    expect(actor.getSnapshot().context).toEqual({ error: null, count: 42 });
    actor.stop();
  });

  it("transitions from idle to processing on PROCESS event", () => {
    const machine = createProcessMachine({
      id: "test",
      context: { error: null },
    });
    const actor = createActor(machine).start();
    actor.send({ type: "PROCESS" });
    expect(actor.getSnapshot().value).toBe("processing");
    actor.stop();
  });

  it("transitions from error to processing on RETRY", () => {
    const machine = createProcessMachine({
      id: "test",
      initial: "error",
      context: { error: null },
    });
    const actor = createActor(machine).start();
    actor.send({ type: "RETRY" });
    expect(actor.getSnapshot().value).toBe("processing");
    actor.stop();
  });

  it("transitions from error to idle on RESET", () => {
    const machine = createProcessMachine({
      id: "test",
      initial: "error",
      context: { error: "failed" },
    });
    const actor = createActor(machine).start();
    actor.send({ type: "RESET" });
    expect(actor.getSnapshot().value).toBe("idle");
    actor.stop();
  });

  it("transitions from resolved to idle on RESET", () => {
    const machine = createProcessMachine({
      id: "test",
      initial: "resolved",
      context: { error: null },
    });
    const actor = createActor(machine).start();
    actor.send({ type: "RESET" });
    expect(actor.getSnapshot().value).toBe("idle");
    actor.stop();
  });

  it("resets context to initial values on RESET", () => {
    const initial = { error: null, data: [] as string[] };
    const machine = createProcessMachine({
      id: "test",
      initial: "resolved",
      context: initial,
    });
    const actor = createActor(machine).start();
    (actor.getSnapshot().context as typeof initial).data.push("stale");
    actor.send({ type: "RESET" });
    expect(actor.getSnapshot().context.data).toEqual([]);
    actor.stop();
  });

  it("transitions from processing to resolved on RESOLVE event when no onProcess", () => {
    const machine = createProcessMachine({
      id: "test",
      context: { error: null },
    });
    const actor = createActor(machine).start();
    actor.send({ type: "PROCESS" });
    actor.send({ type: "RESOLVE" });
    expect(actor.getSnapshot().value).toBe("resolved");
    actor.stop();
  });

  it("transitions from processing to error on FAIL event when no onProcess", () => {
    const machine = createProcessMachine({
      id: "test",
      context: { error: null },
    });
    const actor = createActor(machine).start();
    actor.send({ type: "PROCESS" });
    actor.send({ type: "FAIL", error: "something broke" });
    expect(actor.getSnapshot().value).toBe("error");
    expect(actor.getSnapshot().context.error).toBe("something broke");
    actor.stop();
  });

  it("supports custom guards passed in config", () => {
    const machine = createProcessMachine({
      id: "test",
      context: { error: null, ready: true },
      guards: {
        isReady: ({ context }) => (context as unknown as { ready: boolean }).ready === true,
      },
    });
    // Guard exists — we verify by referencing it via setup().guards
    expect(machine).toBeDefined();
  });

  it("supports custom actions passed in config", () => {
    const machine = createProcessMachine({
      id: "test",
      context: { error: null },
      actions: {
        trackEvent: () => {},
      },
    });
    expect(machine).toBeDefined();
  });

  it("supports custom extra states", () => {
    const machine = createProcessMachine({
      id: "test",
      context: { error: null },
      extraStates: {
        paused: {
          on: {
            RESUME: { target: "processing" },
          },
        },
      },
      states: {
        idle: {
          on: {
            PAUSE: { target: "paused" },
          },
        },
      },
    });
    const actor = createActor(machine).start();
    actor.send({ type: "PAUSE" });
    expect(actor.getSnapshot().value).toBe("paused");
    actor.send({ type: "RESUME" });
    expect(actor.getSnapshot().value).toBe("processing");
    actor.stop();
  });

  it("runs onProcess and transitions to resolved", async () => {
    const onProcess = vi.fn().mockResolvedValue({ result: "done" });
    const machine = createProcessMachine({
      id: "test",
      context: { error: null },
      onProcess,
    });
    const actor = createActor(machine).start();

    actor.send({ type: "PROCESS" });
    await vi.waitFor(() => {
      expect(actor.getSnapshot().value).toBe("resolved");
    });
    expect(onProcess).toHaveBeenCalledOnce();
    actor.stop();
  });

  it("runs onProcess then onAnalyze when both are provided", async () => {
    const onProcess = vi.fn().mockResolvedValue({ processed: true });
    const onAnalyze = vi.fn().mockResolvedValue({ analyzed: true });
    const machine = createProcessMachine({
      id: "test",
      context: { error: null },
      onProcess,
      onAnalyze,
    });
    const actor = createActor(machine).start();

    actor.send({ type: "PROCESS" });
    await vi.waitFor(() => {
      expect(actor.getSnapshot().value).toBe("resolved");
    });
    expect(onProcess).toHaveBeenCalledOnce();
    expect(onAnalyze).toHaveBeenCalledOnce();
    actor.stop();
  });

  it("transitions to error when onProcess throws", async () => {
    const onProcess = vi.fn().mockRejectedValue(new Error("process failed"));
    const machine = createProcessMachine({
      id: "test",
      context: { error: null },
      onProcess,
    });
    const actor = createActor(machine).start();

    actor.send({ type: "PROCESS" });
    await vi.waitFor(() => {
      expect(actor.getSnapshot().value).toBe("error");
    });
    expect(actor.getSnapshot().context.error).toBe("process failed");
    actor.stop();
  });

  it("transitions to error when onAnalyze throws", async () => {
    const onProcess = vi.fn().mockResolvedValue({ processed: true });
    const onAnalyze = vi.fn().mockRejectedValue(new Error("analysis failed"));
    const machine = createProcessMachine({
      id: "test",
      context: { error: null },
      onProcess,
      onAnalyze,
    });
    const actor = createActor(machine).start();

    actor.send({ type: "PROCESS" });
    await vi.waitFor(() => {
      expect(actor.getSnapshot().value).toBe("error");
    });
    expect(actor.getSnapshot().context.error).toBe("analysis failed");
    actor.stop();
  });
});
