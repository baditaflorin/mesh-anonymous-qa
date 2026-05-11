# mesh-anonymous-qa

[![Live](https://img.shields.io/badge/live-baditaflorin.github.io%2Fmesh--anonymous--qa-3aa0ff?style=flat-square)](https://baditaflorin.github.io/mesh-anonymous-qa/)
[![Version](https://img.shields.io/github/package-json/v/baditaflorin/mesh-anonymous-qa?style=flat-square&color=7886a3)](https://github.com/baditaflorin/mesh-anonymous-qa/blob/main/package.json)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![No backend](https://img.shields.io/badge/backend-none-0d0f15?style=flat-square)](docs/adr/0001-deployment-mode.md)

> Peer-to-peer browser mesh for audience Q&A. Submit anonymously, upvote others, presenter answers from the top. Free replacement for Slido and Mentimeter Q&A.

**Live:** https://baditaflorin.github.io/mesh-anonymous-qa/

Open the link on every audience phone and the presenter laptop. Pick a room. Audience submits questions and votes; presenter sees the same list sorted by votes and marks each one answered as they take it on stage. No login, no signup, no third-party server.

## How it works

- Every phone joins a shared **Yjs document** over **y-webrtc** via my [self-hosted signaling server](https://github.com/baditaflorin/signaling-server).
- Questions are a `Y.Array<{id, text, ts, answered}>`. Submissions push onto the array; everyone sees them within ~100 ms.
- Votes are a flat `Y.Map<"<questionId>:<voterId>", 1|-1>`. Each phone has a persisted `crypto.randomUUID()` as its voter identity. Net score per question is the sum of values.
- Marking answered toggles `answered: true` on a question. Answered questions stay visible (struck through) so late joiners see what's already covered.
- A "Clear answered" action in Settings hard-deletes the answered ones when the list gets long.

## Privacy threat model

See [docs/privacy.md](docs/privacy.md). Question text is anonymous in transit (no author tag in the CRDT). Votes are linkable per browser (so the same person can't multi-vote) but not to any external identity. A determined user can clear `localStorage` to multi-vote; acceptable for informal use.

## Architecture

- **Mode A** — pure GitHub Pages, zero backend at runtime. ([ADR 0001](docs/adr/0001-deployment-mode.md))
- **WebRTC transport** — Yjs + y-webrtc, with a self-hosted signaling server and TURN relay you can swap from the Settings drawer.
- **No GitHub Actions** — the `docs/` directory is the built site, committed directly. Pre-push hooks gate formatting, typecheck, and a build smoke test.

## Run it locally

```bash
git clone https://github.com/baditaflorin/mesh-anonymous-qa.git
cd mesh-anonymous-qa
npm install
npm run dev
```

## Self-hosted infrastructure

| Repo                                                                   | Endpoint                               | Role                        |
| ---------------------------------------------------------------------- | -------------------------------------- | --------------------------- |
| [signaling-server](https://github.com/baditaflorin/signaling-server)   | `wss://turn.0docker.com/ws`            | y-webrtc protocol fan-out   |
| [turn-token-server](https://github.com/baditaflorin/turn-token-server) | `https://turn.0docker.com/credentials` | HMAC TURN creds, 1-hour TTL |
| [coturn-hetzner](https://github.com/baditaflorin/coturn-hetzner)       | `turn:turn.0docker.com:3479`           | TURN relay                  |

All three are mine. Override them from the in-app Settings drawer if you want to use your own.

## Settings (in-app)

- **Room ID** — phones must share one to see each other.
- **Mode** — `audience` (default) for submitting and voting, `presenter` for marking answered with big-text view.
- **Mark all answered** — moderator action, marks every outstanding question answered.
- **Clear answered** — moderator action, permanently deletes every answered question.
- **Signaling URL** / **TURN credentials URL** — override defaults.

All persisted to `localStorage`.

## ADRs

- [0001 — Deployment mode (Mode A, pure Pages)](docs/adr/0001-deployment-mode.md)
- [0002 — Vote dedup via persisted peer ID](docs/adr/0002-vote-dedup.md)
- [0003 — Answered persists, doesn't delete](docs/adr/0003-answered-state.md)
- [0010 — GitHub Pages publishing strategy](docs/adr/0010-pages-publishing.md)

## Local hooks (no GitHub Actions)

```bash
git config core.hooksPath .githooks
```

- **pre-commit** — `prettier --check` + `tsc --noEmit`
- **commit-msg** — Conventional Commits validator
- **pre-push** — runs `scripts/smoke.sh` (build + sanity-check `docs/`)

## License

[MIT](LICENSE) © 2026 Florin Badita
