import type { CyberAccessProgram } from "../../packages/gateway-protocol/src/schema/sessions-row.js";
import type { PreparedOperatorModelPolicy } from "./operator-model-policy.types.js";

/** Access inherits the historical alias ceiling, independently of the chosen model. */
export function isOperatorAccessProgramAllowed(
  policy: PreparedOperatorModelPolicy | undefined,
  program: CyberAccessProgram | undefined,
): boolean {
  if (!policy || !program || program === "standard") {
    return true;
  }
  return policy.allows({
    provider: "openai",
    model: program === "daybreak_blue" ? "gpt-daybreak-blue-latest" : "gpt-daybreak-red-latest",
  });
}
