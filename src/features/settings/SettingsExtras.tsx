import { MeshButton } from "@baditaflorin/mesh-common";
import type { Mode } from "../../App";

type Props = {
  mode: Mode;
  onModeChange: (next: Mode) => void;
};

export function SettingsExtras({ mode, onModeChange }: Props) {
  const markAllAnswered = () => {
    if (!confirm("Mark every question in this shared room as covered?")) return;
    window.dispatchEvent(new CustomEvent("qa:mark-all-answered"));
  };

  const clearAnswered = () => {
    if (!confirm("Permanently delete every covered question from this shared room?")) return;
    window.dispatchEvent(new CustomEvent("qa:clear-answered"));
  };

  return (
    <>
      <section className="qa-settings-section" aria-labelledby="qa-role-settings-title">
        <h3 id="qa-role-settings-title">This browser’s role</h3>
        <p>
          Facilitator mode changes the controls here. It does not grant administrative access or
          prevent another room participant from selecting it.
        </p>
        <fieldset className="qa-mode-pick">
          <legend>Room role</legend>
          <label className="settings-check">
            <input
              type="radio"
              name="mode"
              checked={mode === "audience"}
              onChange={() => onModeChange("audience")}
            />
            <span>Audience — submit questions and vote</span>
          </label>
          <label className="settings-check">
            <input
              type="radio"
              name="mode"
              checked={mode === "presenter"}
              onChange={() => onModeChange("presenter")}
            />
            <span>Facilitator — mark questions covered</span>
          </label>
        </fieldset>
      </section>

      <section className="qa-settings-section" aria-labelledby="qa-queue-settings-title">
        <h3 id="qa-queue-settings-title">Shared queue actions</h3>
        <p>
          These actions write to the room’s shared state for everyone currently connected or joining
          later.
        </p>
        <div className="settings-actions">
          <MeshButton type="button" variant="secondary" size="sm" onClick={markAllAnswered}>
            Mark all covered
          </MeshButton>
          <MeshButton type="button" variant="danger" size="sm" onClick={clearAnswered}>
            Clear covered
          </MeshButton>
        </div>
      </section>
    </>
  );
}
