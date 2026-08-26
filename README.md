# Open Floor

[![Live](https://img.shields.io/badge/live-Open%20Floor-94ddd2?style=flat-square)](https://baditaflorin.github.io/mesh-anonymous-qa/)
[![Version](https://img.shields.io/github/package-json/v/baditaflorin/mesh-anonymous-qa?style=flat-square&color=7886a3)](https://github.com/baditaflorin/mesh-anonymous-qa/blob/main/package.json)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![Woodpecker](https://img.shields.io/badge/CI-Woodpecker-6fba82?style=flat-square)](https://ci.0exec.com/)

> A calm, facilitated question room for the people sharing a session. Ask, vote, and mark what the room has covered.

**Live:** https://baditaflorin.github.io/mesh-anonymous-qa/

Open the same room on the audience’s phones and the facilitator’s screen. Questions arrive in a shared queue, rise by vote, and stay visible when covered so late joiners keep context.

## A precise visibility boundary

Questions are stored **without an author label** in this app’s shared Yjs document. That does not make their text private or secret: everyone who joins the room can read it, and people with access to the shared state can inspect it. Do not include names or sensitive details.

Votes use a browser-local UUID so repeated votes from the same browser can be toggled rather than stacked. That UUID is linkable within the shared vote data; it is not an account or a proof of personhood. See the full [privacy threat model](docs/privacy.md).

## How the room works

- Every participant joins one shared **Yjs document** through **y-webrtc**. The app uses a self-hosted signaling endpoint and may use TURN for difficult network paths.
- Questions are the real shared `Y.Array<{ id, text, ts, answered }>`; records intentionally contain no author field.
- Votes are the real shared `Y.Map<"<questionId>:<voterId>", 1 | -1>`. Their net score is calculated from those values.
- Facilitator mode changes the controls on that browser. It is **not** an access-control boundary: another participant can select the same mode in Settings.
- “Mark all covered” and “Clear covered” write to the shared room for all current and later participants.

## Run locally

```bash
git clone https://github.com/baditaflorin/mesh-anonymous-qa.git
git clone https://github.com/baditaflorin/mesh-common.git
cd mesh-anonymous-qa
npm ci
npm run dev
```

## Verification

```bash
npm run fmt:check
npm run typecheck
npm run test:unit
npm run test:e2e
npm run smoke
npm run screenshot
npm run demo
npm run audit:security
```

The release checks the actual two-peer question → vote → covered workflow, keyboard labels, 390×844 and 1141×602 layouts, a five-second leak pass, a screenshot, and a two-peer recording. CI runs in the self-hosted Woodpecker fleet; this repository intentionally has no GitHub Actions workflow.

## Infrastructure

| Service          | Default endpoint                       | Purpose                                                   |
| ---------------- | -------------------------------------- | --------------------------------------------------------- |
| Signaling        | `wss://turn.0docker.com/ws`            | y-webrtc peer discovery and WebRTC signaling relay        |
| TURN credentials | `https://turn.0docker.com/credentials` | short-lived relay credentials                             |
| TURN relay       | `turn:turn.0docker.com:3479`           | fallback transport for peers that cannot connect directly |

The endpoints can be changed from Settings on this device. Changing them does not alter the room’s visibility boundary or add access control.

## Release artifacts

After each release, the live Pages site exposes a [screenshot](https://baditaflorin.github.io/mesh-anonymous-qa/screenshot.png), [two-peer preview](https://baditaflorin.github.io/mesh-anonymous-qa/preview.png), [GIF recording](https://baditaflorin.github.io/mesh-anonymous-qa/demo.gif), and [security audit](https://baditaflorin.github.io/mesh-anonymous-qa/security-audit.md).

## Design records

- [Deployment mode](docs/adr/0001-deployment-mode.md)
- [Vote deduplication](docs/adr/0002-vote-dedup.md)
- [Answered-state retention](docs/adr/0003-answered-state.md)
- [Pages publishing](docs/adr/0010-pages-publishing.md)

## License

[MIT](LICENSE) © 2026 Florin Badita
