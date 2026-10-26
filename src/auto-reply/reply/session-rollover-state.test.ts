import { expect, it } from "vitest";
import { resolveReplySessionRolloverState } from "./session-rollover-state.js";

it.each(["standard", "daybreak_blue", "daybreak_red"] as const)(
  "preserves explicit %s Access through /new rollover",
  (cyberAccessProgram) => {
    expect(
      resolveReplySessionRolloverState(
        { sessionId: "fixture", updatedAt: 1, cyberAccessProgram },
        "agent:main:fixture",
      ).cyberAccessProgram,
    ).toBe(cyberAccessProgram);
  },
);
