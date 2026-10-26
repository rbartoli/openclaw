import type { EmbeddedRunAttemptParamsV2 } from "openclaw/plugin-sdk/agent-harness-runtime";

/** A local admission failure, not a failed model request or credential. */
export class CodexAccessProgramUnavailableError extends Error {}

/** Session Access is explicit; missing selections use Standard, never model defaults. */
export function resolveCodexCyberAccessProgram(
  params: EmbeddedRunAttemptParamsV2,
): "standard" | "daybreakBlue" | "daybreakRed" {
  return params.cyberAccessProgram === "daybreak_blue"
    ? "daybreakBlue"
    : params.cyberAccessProgram === "daybreak_red"
      ? "daybreakRed"
      : "standard";
}
