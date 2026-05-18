import { useEffect, useMemo, useState } from "react";
import { MeshShell } from "@baditaflorin/mesh-common";
import { QaBoard } from "./features/qa/QaBoard";
import { SettingsExtras } from "./features/settings/SettingsExtras";
import { appConfig } from "./shared/config";

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

  const voterId = useMemo(() => ensureVoterId(), []);

  useEffect(() => {
    localStorage.setItem(STORAGE.room, roomId);
  }, [roomId]);
  useEffect(() => {
    localStorage.setItem(STORAGE.mode, mode);
  }, [mode]);

  return (
    <MeshShell
      config={appConfig}
      roomId={roomId}
      onRoomChange={setRoomId}
      settingsExtras={<SettingsExtras mode={mode} onModeChange={setMode} />}
    >
      <QaBoard roomId={roomId} mode={mode} voterId={voterId} />
    </MeshShell>
  );
}
