---
status: accepted
date: 2026-05-12
---

# 0003 — Answered persists, doesn't delete

## Context

When a presenter answers a question on stage, what happens to it in the list? Two options:

1. **Delete it.** Clean list, only outstanding questions visible. But late-joining audience members can't see what was already covered and may ask duplicates.
2. **Mark answered, keep visible.** Crowded list, but full context preserved.

## Decision

Tapping "Mark answered" sets `answered: true` on the question. The list keeps it visible but visually de-emphasized (struck through, dimmed, vote buttons disabled, sorted to the bottom).

A separate "Clear answered" action in Settings hard-deletes every `answered: true` question and the related vote entries — for the moderator to use when the list gets long.

The Y.Array data shape stays simple: `{ id, text, ts, answered }`. Toggling `answered` is implemented as `delete + insert` at the same index inside a `Y.Doc.transact` (Yjs Arrays don't support in-place mutation of objects, but a delete+insert pair under one transaction is atomic to peers).

## Consequences

- **Pros.** Late-joiners see what was answered without asking duplicates. Presenter has a satisfying visible "checkmark" history. The hard-delete is an explicit moderator action, never accidental.
- **Cons.** List grows monotonically until someone clears. For a 90-minute Q&A this is fine — 50 questions read comfortably. For a multi-day room you must clear.
- **Sort.** Answered questions sort to the bottom regardless of votes (`answered ? 1 : -1` first, then net votes desc). Active votes stay near the top.

## Alternatives considered

- **Hard-delete on answer.** Rejected — loses context for late-joiners, makes the presenter's history invisible.
- **Archive view toggle.** Considered: a "show answered" toggle. Rejected as more UI than needed; the strikethrough and dimming already make the distinction clear.
- **Auto-clear after N minutes.** Rejected — invisible state changes are confusing; explicit moderator action is clearer.
