import { Show } from "solid-js";
import type { CyberAccessProgram } from "../../../api/types.ts";
import { t } from "../../../lib/reactive/i18n.ts";
import { ChatPreferenceSegments } from "./chat-preference-segments.tsx";

const programLabels = {
  standard: "chat.modelControls.standard",
  daybreak_blue: "chat.modelControls.daybreakBlue",
  daybreak_red: "chat.modelControls.daybreakRed",
} as const;

export type ChatAccessProgramControlProps = {
  programs: readonly CyberAccessProgram[];
  requested?: CyberAccessProgram;
  disabled: boolean;
  sessionKey: string;
  onSelect: (value: CyberAccessProgram | null, sessionKey: string) => unknown;
};

export function ChatAccessProgramControl(props: ChatAccessProgramControlProps) {
  const hasDaybreak = () => props.programs.some((program) => program !== "standard");
  return (
    <Show when={hasDaybreak()}>
      <div class="chat-controls__speed-panel">
        <div class="chat-controls__reasoning-head">
          <span class="chat-controls__effort-heading">{t("chat.modelControls.access")}</span>
        </div>
        <ChatPreferenceSegments
          kind="access"
          label={t("chat.modelControls.access")}
          options={props.programs.map((value) => ({ value, label: t(programLabels[value]) }))}
          selected={props.requested ?? "standard"}
          disabled={props.disabled}
          onSelect={(value) => {
            if (value !== props.requested) {
              void props.onSelect(value, props.sessionKey);
            }
          }}
        />
      </div>
    </Show>
  );
}
