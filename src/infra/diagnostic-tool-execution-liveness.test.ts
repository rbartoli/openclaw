import { AsyncLocalStorage, AsyncResource } from "node:async_hooks";
import { setImmediate as nextTurn } from "node:timers/promises";
import { queryObjects } from "node:v8";
import { expect, it, vi } from "vitest";
import { resolveGlobalSingleton } from "../shared/global-singleton.js";
import {
  createDiagnosticToolExecutionLiveness,
  recordDiagnosticToolExecutionDeadline,
  registerDiagnosticToolExecutionDeadline,
} from "./diagnostic-tool-execution-liveness.js";

it("preserves a closed invocation's fixed allowance until its signal aborts", () => {
  const controller = new AbortController();
  const invocation = createDiagnosticToolExecutionLiveness(controller.signal);
  const frame = invocation.run(() => {
    recordDiagnosticToolExecutionDeadline(100);
    registerDiagnosticToolExecutionDeadline(200);
    return AsyncLocalStorage.snapshot();
  });
  expect(invocation.view.deadlineAtMs).toBe(200);
  invocation.close();
  expect(invocation.view.deadlineAtMs).toBe(100);
  frame(() => {
    recordDiagnosticToolExecutionDeadline(300);
    registerDiagnosticToolExecutionDeadline(400)?.();
  });
  expect(invocation.view.deadlineAtMs).toBe(100);
  controller.abort(new Error("invocation finished"));
  expect(invocation.view.deadlineAtMs).toBeUndefined();
});

it("releases closed invocation signals from retained transport resources and frames", async () => {
  function completedInvocation() {
    const controller = new AbortController();
    const owner = { tools: ["read", "web_fetch"] };
    const invocation = createDiagnosticToolExecutionLiveness(controller.signal);
    const retained = invocation.run(() => ({
      resource: new AsyncResource("retained-tool-transport", { requireManualDestroy: true }),
      frame: AsyncLocalStorage.snapshot(),
    }));
    invocation.close();
    controller.abort(Object.assign(new Error("invocation finished"), { owner }));
    return {
      ...retained,
      owner: new WeakRef(owner),
      signal: new WeakRef(controller.signal),
    };
  }
  const completed = Array.from({ length: 20 }, completedInvocation);
  try {
    const control = new WeakRef({});
    await nextTurn();
    queryObjects(WeakRef);
    expect(control.deref()).toBeUndefined();
    expect(completed.filter(({ signal }) => signal.deref())).toHaveLength(0);
    expect(completed.filter(({ owner }) => owner.deref())).toHaveLength(0);
    completed[0]!.resource.runInAsyncScope(() => recordDiagnosticToolExecutionDeadline(100));
    completed[0]!.frame(() => registerDiagnosticToolExecutionDeadline(200)?.());
  } finally {
    for (const { resource } of completed) {
      resource.emitDestroy();
    }
  }
});

it("preserves released deadline callbacks and callers while runtime chunks drain", () => {
  const { context } = resolveGlobalSingleton(
    Symbol.for("openclaw.diagnosticToolExecutionLiveness"),
    () => ({ context: new AsyncLocalStorage<(deadline: number | undefined) => void>() }),
  );
  const releasedRecord = vi.fn();
  context.run(releasedRecord, () => {
    recordDiagnosticToolExecutionDeadline(100);
    expect(registerDiagnosticToolExecutionDeadline(200)).toBeUndefined();
  });
  expect(releasedRecord).toHaveBeenCalledExactlyOnceWith(100);

  const invocation = createDiagnosticToolExecutionLiveness();
  try {
    invocation.run(() => {
      context.getStore()?.(100);
      const release = registerDiagnosticToolExecutionDeadline(200);
      expect(invocation.view.deadlineAtMs).toBe(200);
      release?.();
      expect(invocation.view.deadlineAtMs).toBe(100);
    });
  } finally {
    invocation.close();
  }
});
