import { createMeshConfig } from "@baditaflorin/mesh-common";

export const appConfig = createMeshConfig({
  appName: "mesh-anonymous-qa",
  breadcrumbs: false,
  displayName: "Open Floor",
  visualProfile: "gather",
  shellLayout: "inset",
  description:
    "A facilitated question room where questions are stored without author labels for everyone sharing the room.",
  accentHex: "#94ddd2",
  version: __APP_VERSION__,
  commit: __GIT_COMMIT__,
  signalingUrl:
    (import.meta.env.VITE_WEBRTC_SIGNALING as string | undefined) ?? "wss://turn.0docker.com/ws",
  turnTokenUrl:
    (import.meta.env.VITE_TURN_TOKEN_URL as string | undefined) ??
    "https://turn.0docker.com/credentials",
});
