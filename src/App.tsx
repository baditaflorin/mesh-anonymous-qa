import { useEffect, useMemo, useState } from "react";
import { QaBoard } from "./features/qa/QaBoard";
import { SettingsDrawer } from "./features/settings/SettingsDrawer";
import { appConfig } from "./shared/config";
import { InviteShareButton, MeshBeacon } from "@baditaflorin/mesh-common";

export type Mode = "audience" | "presenter";

const STORAGE = {
  room: `${appConfig.storagePrefix}:room`,
  mode: `${appConfig.storagePrefix}:mode`,
  voter: `${appConfig.storagePrefix}:voterId`,
};

function readString(key: string, fallback: string): string {
  return localStorage.getItem(key) ?? fallback;
}

function ensureVoterId(): string {
  const existing = localStorage.getItem(STORAGE.voter);
  if (existing && existing.length > 0) return existing;
  const fresh = crypto.randomUUID();
  localStorage.setItem(STORAGE.voter, fresh);
  return fresh;
}

export function App() {
  const [roomId, setRoomId] = useState(() => readString(STORAGE.room, "default"));
  const [mode, setMode] = useState<Mode>(() => {
    const raw = readString(STORAGE.mode, "audience");
    return raw === "presenter" ? "presenter" : "audience";
  });
  const [settingsOpen, setSettingsOpen] = useState(false);

  const voterId = useMemo(() => ensureVoterId(), []);

  useEffect(() => {
    localStorage.setItem(STORAGE.room, roomId);
  }, [roomId]);
  useEffect(() => {
    localStorage.setItem(STORAGE.mode, mode);
  }, [mode]);

  return (
    <div className="app-root">
      <QaBoard roomId={roomId} mode={mode} voterId={voterId} />

      <InviteShareButton appName={appConfig.appName} roomId={roomId} />
      <MeshBeacon app={appConfig.appName} room={roomId} />

      <button
        type="button"
        className="settings-fab"
        onClick={() => setSettingsOpen(true)}
        aria-label="Open settings"
      >
        ⚙
      </button>

      <div className="self-ref">
        <a href={appConfig.repositoryUrl} target="_blank" rel="noreferrer">
          source
        </a>
        <span aria-hidden="true">·</span>
        <a href={appConfig.paypalUrl} target="_blank" rel="noreferrer">
          tip ♥
        </a>
        <span aria-hidden="true">·</span>
        <span>
          v{appConfig.version} · {appConfig.commit}
        </span>
      </div>

      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        roomId={roomId}
        onRoomChange={setRoomId}
        mode={mode}
        onModeChange={setMode}
      />
    </div>
  );
}
