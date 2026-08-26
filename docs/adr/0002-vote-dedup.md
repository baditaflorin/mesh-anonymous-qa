---
status: accepted
date: 2026-05-12
---

# 0002 — Vote dedup via persisted peer ID

## Context

Each question has up/down votes. Without dedup, the same person could vote multiple times by simply reloading the tab. Yjs awareness gives each session a `clientID`, but that resets on every page load — too volatile to use as a voter identity.

We need a stable per-browser identifier so the same browser cannot accidentally stack votes on the same question. The identifier is not a login, but it is visible in shared vote-map keys and links that browser's votes together.

## Decision

On first launch, the app generates `crypto.randomUUID()` and writes it to `localStorage` under `mesh-anonymous-qa:voterId`. That UUID is the **voter identity** used for vote dedup.

Vote state in the Yjs document is a flat `Y.Map<string, 1|-1>` keyed by `"<questionId>:<voterId>"`. To compute the net score for a question, iterate keys with that prefix and sum values. To toggle a vote, the client writes (or deletes) its own key — the CRDT merges concurrent edits idempotently.

Casting the same direction twice clears the vote (toggle). Casting the opposite direction overwrites.

## Consequences

- **Pros.** The UUID is not an account and is stable across reloads, including offline reloads. The flat shared structure is simple and does not need special collision-resolution code.
- **Cons.** Room participants can inspect a UUID in vote keys and link votes made by that browser. A determined user can clear `localStorage` (or use private windows) and double-vote. This is appropriate only for informal Q&A where ballot stuffing is not the threat model.
- **Quota.** The flat namespace grows O(voters × questions) but each entry is ~50 bytes; a 200-person room with 50 questions = ~500 KB in the CRDT. Fine.

## Alternatives considered

- **Awareness `clientID` as voter identity.** Rejected — resets on reload, so users would vote multiple times accidentally just by switching tabs.
- **Nested `Y.Map<questionId, Y.Map<voterId, 1|-1>>`.** Equivalent data shape; flat keying is simpler to iterate and easier to clean up when a question is deleted.
- **Server-side dedup (IP, cookie).** Rejected — there is no server. Mode A deployment.
- **Anonymous credentials / Semaphore.** Rejected for this informal room model. A different system is needed when private voting or strong sybil resistance matters.
