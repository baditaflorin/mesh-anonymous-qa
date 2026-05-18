import type { Mode } from "../../App";

type Props = {
  mode: Mode;
  onModeChange: (next: Mode) => void;
};

export function SettingsExtras({ mode, onModeChange }: Props) {
  const markAllAnswered = () => {
    if (!confirm("Mark every question as answered?")) return;
    window.dispatchEvent(new CustomEvent("qa:mark-all-answered"));
  };

  const clearAnswered = () => {
    if (!confirm("Permanently delete every answered question?")) return;
    window.dispatchEvent(new CustomEvent("qa:clear-answered"));
  };

  return (
    <>
      <fieldset className="qa-mode-pick">
        <legend>Mode</legend>
        <label className="settings-check">
          <input
            type="radio"
            name="mode"
            checked={mode === "audience"}
            onChange={() => onModeChange("audience")}
          />
          <span>Audience (submit + vote)</span>
        </label>
        <label className="settings-check">
          <input
            type="radio"
            name="mode"
            checked={mode === "presenter"}
            onChange={() => onModeChange("presenter")}
          />
          <span>Presenter (mark answered)</span>
        </label>
      </fieldset>

      <div className="settings-actions">
        <button type="button" onClick={markAllAnswered}>
          Mark all answered
        </button>
        <button type="button" onClick={clearAnswered}>
          Clear answered
        </button>
      </div>
    </>
  );
}
